import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ROLES, USER_STATUS, VENDOR_STATUS } from '../constants/enums.js';
import { Manager } from '../models/Manager.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = jwt.verify(token, env.accessTokenSecret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('User not found', 401);
  if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    throw new AppError('Account is not allowed to access the platform', 403);
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You are not allowed to perform this action', 403));
  }
  next();
};

export const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  if (![ROLES.VENDOR_ADMIN, ROLES.VENDOR_MANAGER, ROLES.MANAGER].includes(req.user.role)) {
    throw new AppError('Vendor access required', 403);
  }

  const vendor = await Vendor.findOne(
    req.user.role === ROLES.VENDOR_ADMIN ? { owner: req.user._id } : { _id: req.user.vendor },
  );

  if (!vendor) throw new AppError('Vendor not found', 404);
  if (vendor.status !== VENDOR_STATUS.APPROVED) {
    throw new AppError('Vendor account is not approved', 403);
  }

  req.vendor = vendor;
  next();
});

export const requireManagerPermission = (permission) => asyncHandler(async (req, res, next) => {
  if (![ROLES.VENDOR_MANAGER, ROLES.MANAGER].includes(req.user.role)) return next();

  const manager = await Manager.findOne({ user: req.user._id, vendor: req.user.vendor });
  if (!manager) throw new AppError('Manager profile not found', 403);
  if (!manager.permissions?.[permission]) {
    throw new AppError(`Manager permission required: ${permission}`, 403);
  }

  req.manager = manager;
  next();
});
