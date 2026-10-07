import { ROLES, USER_STATUS } from '../constants/enums.js';
import { Manager } from '../models/Manager.js';
import { ManagerInvite } from '../models/ManagerInvite.js';
import { User } from '../models/User.js';
import { verifyInviteJwt } from '../services/inviteService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashToken, signAccessToken } from '../utils/tokens.js';

function authResponse(user, statusCode, res) {
  const token = signAccessToken(user);
  res.status(statusCode).json({ user, token });
}

export const registerCustomer = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new AppError('Email is already registered', 409);

  const user = await User.create({ ...req.body, role: ROLES.CUSTOMER, status: USER_STATUS.ACTIVE });
  authResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    throw new AppError('Account is not allowed to access the platform', 403);
  }
  if (user.status === USER_STATUS.INVITED || user.isActive === false) {
    throw new AppError('Please accept your invitation before logging in', 403);
  }

  user.lastLoginAt = new Date();
  await user.save();
  authResponse(user, 200, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const acceptManagerInvite = asyncHandler(async (req, res) => {
  const inviteTokenHash = hashToken(req.body.token);
  const user = await User.findOne({
    inviteTokenHash,
    status: USER_STATUS.INVITED,
    inviteExpiresAt: { $gt: new Date() },
  }).select('+inviteTokenHash');

  if (!user) throw new AppError('Invite token is invalid or expired', 400);

  if (req.body.name) user.name = req.body.name;
  user.password = req.body.password;
  user.status = USER_STATUS.ACTIVE;
  user.inviteTokenHash = undefined;
  user.inviteExpiresAt = undefined;
  await user.save();

  authResponse(user, 200, res);
});

export const validateSetPasswordToken = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = verifyInviteJwt(req.params.token);
  } catch {
    throw new AppError('This invite link has expired or is invalid', 400);
  }

  const invite = await ManagerInvite.findOne({
    tokenId: payload.tokenId,
    user: payload.userId,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).populate('vendor', 'storeName');

  if (!invite) throw new AppError('This invite link has expired, ask the store owner to resend it', 400);

  res.json({
    valid: true,
    email: invite.email,
    storeName: invite.vendor?.storeName,
    expiresAt: invite.expiresAt,
  });
});

export const setPassword = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = verifyInviteJwt(req.body.token);
  } catch {
    throw new AppError('This invite link has expired or is invalid', 400);
  }

  const invite = await ManagerInvite.findOne({
    tokenId: payload.tokenId,
    user: payload.userId,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!invite) throw new AppError('This invite link has expired, ask the store owner to resend it', 400);

  const user = await User.findOne({
    _id: payload.userId,
    email: payload.email,
    vendor: payload.vendorId,
    role: { $in: [ROLES.VENDOR_MANAGER, ROLES.MANAGER] },
  }).select('+password');

  if (!user) throw new AppError('Invited manager account not found', 404);

  user.password = req.body.password;
  user.isActive = true;
  user.status = USER_STATUS.ACTIVE;
  await user.save();

  await Manager.findOneAndUpdate(
    { user: user._id, vendor: user.vendor },
    { acceptedAt: new Date() },
  );

  invite.usedAt = new Date();
  await invite.save();

  res.json({ message: 'Password set successfully. You can now sign in.' });
});
