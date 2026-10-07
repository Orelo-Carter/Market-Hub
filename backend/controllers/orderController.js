import { ORDER_STATUS, ROLES } from '../constants/enums.js';
import { Manager } from '../models/Manager.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { SubOrder } from '../models/SubOrder.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';

export const listMyOrders = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const [orders, total] = await Promise.all([
    Order.find({ customer: req.user._id })
      .populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }, { path: 'items.product' }] })
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    Order.countDocuments({ customer: req.user._id }),
  ]);
  res.json(paginatedResponse({ data: orders, total, page, limit }));
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, customer: req.user._id })
    .populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }, { path: 'items.product' }] });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ order });
});

export const listVendorOrders = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const subOrderFilter = { vendor: req.vendor._id };
  if (query.status) subOrderFilter.status = query.status;

  const [orders, total] = await Promise.all([
    SubOrder.find(subOrderFilter)
      .populate('order')
      .populate('customer', 'name email')
      .populate('vendor', 'storeName')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    SubOrder.countDocuments(subOrderFilter),
  ]);

  const scopedOrders = orders.map((subOrder) => ({
    _id: subOrder.order?._id || subOrder.order,
    subOrderId: subOrder._id,
    customer: subOrder.customer,
    customerName: subOrder.customer?.name,
    orderId: subOrder.order?._id || subOrder.order,
    subOrders: [subOrder],
    total: subOrder.subtotal,
    totalAmount: subOrder.subtotal,
    status: subOrder.status,
    createdAt: subOrder.createdAt,
  }));

  res.json(paginatedResponse({ data: scopedOrders, total, page, limit }));
});

export const updateVendorSubOrderStatus = asyncHandler(async (req, res) => {
  if ([ROLES.VENDOR_MANAGER, ROLES.MANAGER].includes(req.user.role)) {
    const manager = await Manager.findOne({ user: req.user._id, vendor: req.vendor._id });
    if (!manager?.permissions.canViewOrders && !manager?.permissions.canManageOrders) {
      throw new AppError('Manager cannot manage orders', 403);
    }
  }

  const subOrder = await SubOrder.findOne(
    req.params.subOrderId
      ? { _id: req.params.subOrderId, order: req.params.orderId, vendor: req.vendor._id }
      : { order: req.params.orderId, vendor: req.vendor._id },
  );
  if (!subOrder) {
    throw new AppError('Sub-order not found for this vendor', 404);
  }

  const previousStatus = subOrder.status;
  subOrder.status = req.body.status;
  subOrder.statusHistory.push({
    status: req.body.status,
    changedBy: req.user._id,
    note: req.body.note,
    trackingNumber: req.body.trackingNumber,
    carrier: req.body.carrier,
  });
  await subOrder.save();

  // Count sales when fulfillment reaches "delivered"; this is the least ambiguous status in the existing order flow.
  if (previousStatus !== ORDER_STATUS.DELIVERED && req.body.status === ORDER_STATUS.DELIVERED) {
    await Product.bulkWrite(
      subOrder.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { salesCount: Number(item.quantity || 0) } },
        },
      })),
    );
  }

  const order = await Order.findById(subOrder.order).populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }] });
  res.json({ order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const [orders, total] = await Promise.all([
    Order.find().populate('customer', 'name email').populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }] }).skip(skip).limit(limit).sort('-createdAt'),
    Order.countDocuments(),
  ]);
  res.json(paginatedResponse({ data: orders, total, page, limit }));
});
