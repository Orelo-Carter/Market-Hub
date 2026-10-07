import { ROLES, USER_STATUS, VENDOR_STATUS } from '../constants/enums.js';
import { env } from '../config/env.js';
import { Manager } from '../models/Manager.js';
import { ManagerInvite } from '../models/ManagerInvite.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { sendManagerInviteEmail } from '../services/emailService.js';
import { createInviteJwt } from '../services/inviteService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { createOpaqueToken, hashToken, signAccessToken } from '../utils/tokens.js';

export const registerVendor = asyncHandler(async (req, res) => {
  const { name, email, password, storeName, description } = req.body;

  if (await User.findOne({ email })) throw new AppError('Email is already registered', 409);
  if (await Vendor.findOne({ storeName })) throw new AppError('Store name is already taken', 409);

  const owner = await User.create({
    name,
    email,
    password,
    role: ROLES.VENDOR_ADMIN,
    status: USER_STATUS.PENDING,
  });
  const vendor = await Vendor.create({ storeName, description, owner: owner._id });

  owner.vendor = vendor._id;
  await owner.save();

  res.status(201).json({
    user: owner,
    vendor,
    token: signAccessToken(owner),
    message: 'Vendor registration submitted for Super Admin approval',
  });
});

export const getPublicVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({
    slug: req.params.slug,
    status: VENDOR_STATUS.APPROVED,
  }).select('storeName slug description logoUrl banner ratingAvg createdAt');

  if (!vendor) throw new AppError('Vendor not found', 404);

  const productsCount = await Product.countDocuments({
    vendor: vendor._id,
    status: 'approved',
    deletedAt: { $exists: false },
  });

  res.json({ vendor: { ...vendor.toObject(), productsCount } });
});

export const listVendors = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.search) filter.storeName = { $regex: query.search, $options: 'i' };

  const [vendors, total] = await Promise.all([
    Vendor.find(filter).populate('owner', 'name email status').skip(skip).limit(limit).sort('-createdAt'),
    Vendor.countDocuments(filter),
  ]);

  res.json(paginatedResponse({ data: vendors, total, page, limit }));
});

export const listPendingVendors = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);

  const [vendors, total] = await Promise.all([
    Vendor.find({ status: VENDOR_STATUS.PENDING })
      .populate('owner', 'name email status')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    Vendor.countDocuments({ status: VENDOR_STATUS.PENDING }),
  ]);

  res.json(paginatedResponse({ data: vendors, total, page, limit }));
});

export const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) throw new AppError('Vendor not found', 404);

  vendor.status = VENDOR_STATUS.APPROVED;
  vendor.rejectionReason = undefined;
  vendor.approvedAt = new Date();
  vendor.approvedBy = req.user._id;
  await vendor.save();

  await User.findByIdAndUpdate(vendor.owner, { status: USER_STATUS.ACTIVE });
  res.json({ vendor });
});

export const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) throw new AppError('Vendor not found', 404);

  vendor.status = VENDOR_STATUS.REJECTED;
  vendor.rejectionReason = req.body.reason || 'Rejected by Super Admin';
  await vendor.save();

  await User.findByIdAndUpdate(vendor.owner, { status: USER_STATUS.SUSPENDED });
  res.json({ vendor });
});

export const suspendVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) throw new AppError('Vendor not found', 404);

  vendor.status = VENDOR_STATUS.SUSPENDED;
  vendor.suspendedAt = new Date();
  await vendor.save();

  await User.updateMany({ vendor: vendor._id }, { status: USER_STATUS.SUSPENDED });
  res.json({ vendor });
});

export const getMyVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id)
    .populate('owner', 'name email')
    .populate({ path: 'managers', populate: { path: 'user', select: 'name email status' } });

  let permissions = req.user.permissions || {};
  if ([ROLES.VENDOR_MANAGER, ROLES.MANAGER].includes(req.user.role)) {
    const manager = await Manager.findOne({ user: req.user._id, vendor: req.vendor._id });
    permissions = {
      canCreateProduct: Boolean(manager?.permissions?.canCreateProduct),
      canEditProduct: Boolean(manager?.permissions?.canEditProduct),
      canDeleteProduct: Boolean(manager?.permissions?.canDeleteProduct),
      canViewOrders: Boolean(manager?.permissions?.canViewOrders || manager?.permissions?.canManageOrders),
    };
  }

  res.json({
    role: req.user.role,
    permissions,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    vendor,
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VENDOR_ADMIN) {
    throw new AppError('Only vendor admins can update store settings', 403);
  }

  const updates = {};
  ['storeName', 'description', 'logo', 'banner'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  ['bankName', 'accountNumber', 'accountName'].forEach((field) => {
    if (req.body[field] !== undefined) updates[`payoutDetails.${field}`] = req.body[field];
  });

  const vendor = await Vendor.findOneAndUpdate(
    { _id: req.vendor._id, owner: req.user._id },
    updates,
    { new: true, runValidators: true },
  ).populate('owner', 'name email');

  if (!vendor) throw new AppError('Vendor store not found', 404);
  res.json({ vendor });
});

export const inviteManager = asyncHandler(async (req, res) => {
  const { email, name, permissions } = req.body;
  const existing = await User.findOne({ email });
  if (existing && existing.role !== ROLES.MANAGER) {
    throw new AppError('This email belongs to a non-manager account', 409);
  }
  if (existing?.vendor && existing.vendor.toString() !== req.vendor._id.toString()) {
    throw new AppError('Manager already belongs to another vendor', 409);
  }

  const token = createOpaqueToken();
  const inviteTokenHash = hashToken(token);
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = existing || await User.create({
    name: name || email.split('@')[0],
    email,
    role: ROLES.MANAGER,
    status: USER_STATUS.INVITED,
    vendor: req.vendor._id,
    inviteTokenHash,
    inviteExpiresAt,
  });

  if (existing) {
    user.status = USER_STATUS.INVITED;
    user.vendor = req.vendor._id;
    user.inviteTokenHash = inviteTokenHash;
    user.inviteExpiresAt = inviteExpiresAt;
    await user.save();
  }

  const manager = await Manager.findOneAndUpdate(
    { user: user._id, vendor: req.vendor._id },
    { permissions, invitedBy: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (!req.vendor.managers.some((id) => id.toString() === manager._id.toString())) {
    req.vendor.managers.push(manager._id);
    await req.vendor.save();
  }

  res.status(201).json({
    manager,
    inviteToken: token,
    message: 'Email delivery is not configured yet; send this inviteToken to the manager manually.',
  });
});

function normalizeManagerPermissions(permissions = {}) {
  return {
    canCreateProduct: Boolean(permissions.canCreateProduct),
    canEditProduct: Boolean(permissions.canEditProduct),
    canDeleteProduct: Boolean(permissions.canDeleteProduct),
    canViewOrders: Boolean(permissions.canViewOrders),
    canManageOrders: Boolean(permissions.canViewOrders),
  };
}

async function requireVendorOwner(user, vendorId) {
  const vendor = await Vendor.findOne({ _id: vendorId, owner: user._id });
  if (!vendor) throw new AppError('You can only manage managers for your own vendor store', 403);
  return vendor;
}

function publicManager(manager) {
  const user = manager.user;
  return {
    _id: user._id,
    managerId: manager._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isActive ? 'active' : 'invited',
    isActive: user.isActive,
    permissions: manager.permissions,
    invitedAt: manager.createdAt,
    acceptedAt: manager.acceptedAt,
  };
}

export const listVendorManagers = asyncHandler(async (req, res) => {
  await requireVendorOwner(req.user, req.params.vendorId);

  const managers = await Manager.find({ vendor: req.params.vendorId })
    .populate('user', 'name email role status isActive permissions')
    .sort('-createdAt');

  res.json({ managers: managers.map(publicManager) });
});

export const inviteVendorManager = asyncHandler(async (req, res) => {
  const vendor = await requireVendorOwner(req.user, req.params.vendorId);
  const email = req.body.email.toLowerCase().trim();
  const permissions = normalizeManagerPermissions(req.body.permissions);

  const existingUser = await User.findOne({ email });
  if (existingUser?.vendor && existingUser.vendor.toString() !== vendor._id.toString()) {
    throw new AppError('This email is already tied to another vendor', 409);
  }
  if (existingUser?.vendor?.toString() === vendor._id.toString()) {
    throw new AppError('This email is already a user for this vendor', 409);
  }
  if (existingUser && !existingUser.vendor) {
    throw new AppError('This email already belongs to a platform account', 409);
  }

  let user;
  let manager;
  let invite;

  try {
    user = await User.create({
      name: email.split('@')[0],
      email,
      password: undefined,
      role: ROLES.VENDOR_MANAGER,
      vendor: vendor._id,
      permissions,
      isActive: false,
      status: USER_STATUS.INVITED,
    });

    manager = await Manager.create({
      vendor: vendor._id,
      user: user._id,
      permissions,
      invitedBy: req.user._id,
    });

    if (!vendor.managers.some((id) => id.toString() === manager._id.toString())) {
      vendor.managers.push(manager._id);
      await vendor.save();
    }

    const { token, tokenId, expiresAt } = createInviteJwt({
      userId: user._id,
      vendorId: vendor._id,
      email,
    });

    invite = await ManagerInvite.create({
      user: user._id,
      vendor: vendor._id,
      tokenId,
      email,
      expiresAt,
    });

    const inviteUrl = `${env.frontendUrl}/set-password?token=${encodeURIComponent(token)}`;
    await sendManagerInviteEmail({ to: email, storeName: vendor.storeName, inviteUrl });

    res.status(201).json({ manager: publicManager({ ...manager.toObject(), user }) });
  } catch (error) {
    if (invite?._id) await ManagerInvite.findByIdAndDelete(invite._id);
    if (manager?._id) await Manager.findByIdAndDelete(manager._id);
    if (user?._id) await User.findByIdAndDelete(user._id);
    if (error.isOperational) throw error;
    throw new AppError('Manager invite could not be sent. No manager account was created.', 500);
  }
});

export const updateVendorManagerPermissions = asyncHandler(async (req, res) => {
  await requireVendorOwner(req.user, req.params.vendorId);
  const permissions = normalizeManagerPermissions(req.body.permissions);

  const manager = await Manager.findOneAndUpdate(
    { vendor: req.params.vendorId, user: req.params.userId },
    { permissions },
    { new: true },
  ).populate('user', 'name email role status isActive permissions');

  if (!manager) throw new AppError('Manager not found for this vendor', 404);

  await User.findByIdAndUpdate(req.params.userId, { permissions });
  res.json({ manager: publicManager(manager) });
});

export const removeVendorManager = asyncHandler(async (req, res) => {
  const vendor = await requireVendorOwner(req.user, req.params.vendorId);
  const manager = await Manager.findOneAndDelete({ vendor: vendor._id, user: req.params.userId });
  if (!manager) throw new AppError('Manager not found for this vendor', 404);

  await User.findByIdAndDelete(req.params.userId);
  vendor.managers = vendor.managers.filter((id) => id.toString() !== manager._id.toString());
  await vendor.save();

  res.status(204).send();
});

export const updateManagerPermissions = asyncHandler(async (req, res) => {
  const manager = await Manager.findOneAndUpdate(
    { _id: req.params.managerId, vendor: req.vendor._id },
    { permissions: req.body.permissions },
    { new: true },
  ).populate('user', 'name email status');

  if (!manager) throw new AppError('Manager not found', 404);
  res.json({ manager });
});

export const listManagers = asyncHandler(async (req, res) => {
  const managers = await Manager.find({ vendor: req.vendor._id }).populate('user', 'name email status');
  res.json({ managers });
});
