import mongoose from 'mongoose';
import { ORDER_STATUS, PRODUCT_STATUS } from '../constants/enums.js';
import { Notification } from '../models/Notification.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { SubOrder } from '../models/SubOrder.js';
import { Vendor } from '../models/Vendor.js';
import {
  generatePaymentReference,
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from '../services/paystackService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function selectedVariantOptions(product, variantSelection = {}) {
  if (!product.variants?.length) return { options: [], failures: [] };

  const failures = [];
  const options = product.variants.map((variant) => {
    const selected = variantSelection[variant.name];
    const label = typeof selected === 'object' ? selected.label : selected;
    const option = variant.options.find((item) => item.label === label);
    if (!option) failures.push(`${product.name}: select ${variant.name}`);
    return option ? { variantName: variant.name, option } : null;
  }).filter(Boolean);

  return { options, failures };
}

function availableStock(product, options) {
  if (!product.variants?.length) return Number(product.stock || 0);
  return Math.min(...options.map(({ option }) => Number(option.stock || 0)));
}

function productPrice(product, options) {
  return Number(product.price || 0) + options.reduce((sum, { option }) => sum + Number(option.priceModifier || 0), 0);
}

async function buildCheckoutItems(cartItems) {
  const failures = [];
  const productIds = cartItems.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    status: PRODUCT_STATUS.APPROVED,
    deletedAt: { $exists: false },
  }).populate('vendor');
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const validatedItems = cartItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      failures.push({ productId: item.productId, message: 'Product is no longer available' });
      return null;
    }

    const quantity = Number(item.quantity || 0);
    if (!quantity || quantity < 1) {
      failures.push({ productId: item.productId, name: product.name, message: 'Quantity must be at least 1' });
      return null;
    }

    const { options, failures: variantFailures } = selectedVariantOptions(product, item.variantSelection);
    variantFailures.forEach((message) => failures.push({ productId: item.productId, name: product.name, message }));
    if (variantFailures.length) return null;

    const stock = availableStock(product, options);
    if (stock < quantity) {
      failures.push({
        productId: item.productId,
        name: product.name,
        message: `${product.name} only has ${stock} available`,
      });
      return null;
    }

    const price = productPrice(product, options);
    return {
      product,
      quantity,
      options,
      variantSelection: item.variantSelection || {},
      price,
      subtotal: price * quantity,
    };
  }).filter(Boolean);

  if (failures.length) {
    throw new AppError('Some cart items could not be checked out', 400, { failures });
  }

  return validatedItems;
}

function groupItemsByVendor(validatedItems) {
  return validatedItems.reduce((groups, item) => {
    const vendorId = item.product.vendor._id.toString();
    if (!groups.has(vendorId)) {
      groups.set(vendorId, {
        vendor: item.product.vendor,
        items: [],
        subtotal: 0,
      });
    }

    const group = groups.get(vendorId);
    group.items.push(item);
    group.subtotal += item.subtotal;
    return groups;
  }, new Map());
}

async function decrementStock(validatedItems, session) {
  for (const item of validatedItems) {
    if (!item.product.variants?.length) {
      const result = await Product.updateOne(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1) throw new AppError(`Not enough stock for ${item.product.name}`, 409);
      continue;
    }

    const product = await Product.findById(item.product._id).session(session);
    for (const selectedOption of item.options) {
      const variant = product.variants.find((candidate) => candidate.name === selectedOption.variantName);
      const option = variant?.options.find((candidate) => candidate.label === selectedOption.option.label);
      if (!option) throw new AppError(`Variant selection changed for ${product.name}`, 409);
      if (option.stock < item.quantity) throw new AppError(`Not enough stock for ${product.name}`, 409);
      option.stock -= item.quantity;
    }
    await product.save({ session });
  }
}

async function markOrderPaid(order, actorId) {
  if (order.paymentStatus === 'paid') return order;

  order.paymentStatus = 'paid';
  order.payment.status = 'paid';
  order.payment.paidAt = new Date();
  await order.save();

  const subOrders = await SubOrder.find({ order: order._id }).populate('vendor', 'owner storeName');
  await Promise.all(subOrders.map(async (subOrder) => {
    if (subOrder.status === ORDER_STATUS.PENDING) {
      subOrder.status = ORDER_STATUS.CONFIRMED;
      subOrder.statusHistory.push({
        status: ORDER_STATUS.CONFIRMED,
        changedBy: actorId || order.customer,
        note: 'Payment confirmed',
      });
      await subOrder.save();
    }

    if (subOrder.vendor?.owner) {
      await Notification.create({
        recipient: subOrder.vendor.owner,
        vendor: subOrder.vendor._id,
        subOrder: subOrder._id,
        title: 'New order received',
        message: `New paid order for ${subOrder.vendor.storeName}`,
      });
    }
  }));

  return order.populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }, { path: 'items.product' }] });
}

async function verifyAndApplyPayment(reference, actorId) {
  const order = await Order.findOne({ paymentRef: reference });
  if (!order) throw new AppError('Order not found for this payment reference', 404);

  if (order.paymentStatus === 'paid') {
    return order.populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }, { path: 'items.product' }] });
  }

  const transaction = await verifyPaystackTransaction(reference);
  if (transaction.status !== 'success') {
    order.paymentStatus = transaction.status === 'failed' ? 'failed' : order.paymentStatus;
    order.payment.status = order.paymentStatus;
    await order.save();
    return order.populate({ path: 'subOrders', populate: [{ path: 'vendor', select: 'storeName' }, { path: 'items.product' }] });
  }

  const expectedAmount = Math.round(Number(order.totalAmount) * 100);
  if (Number(transaction.amount) !== expectedAmount) {
    throw new AppError('Payment amount does not match order total', 400);
  }

  return markOrderPaid(order, actorId);
}

export const createCheckout = asyncHandler(async (req, res) => {
  const validatedItems = await buildCheckoutItems(req.body.cartItems);
  const vendorGroups = groupItemsByVendor(validatedItems);
  const totalAmount = [...vendorGroups.values()].reduce((sum, group) => sum + group.subtotal, 0);
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      [order] = await Order.create([{
        customer: req.user._id,
        shippingAddress: req.body.shippingAddress,
        paymentStatus: 'pending',
        totalAmount,
        total: totalAmount,
        payment: { provider: 'paystack', status: 'pending' },
      }], { session });

      const subOrders = [];
      for (const group of vendorGroups.values()) {
        const vendor = await Vendor.findById(group.vendor._id).session(session);
        const commissionRate = Number(vendor?.commissionRate ?? 0.1);
        const commissionAmount = Number((group.subtotal * commissionRate).toFixed(2));
        const vendorPayout = Number((group.subtotal - commissionAmount).toFixed(2));
        const [subOrder] = await SubOrder.create([{
          order: order._id,
          vendor: group.vendor._id,
          customer: req.user._id,
          items: group.items.map((item) => ({
            product: item.product._id,
            variant: item.variantSelection,
            name: item.product.name || item.product.title,
            image: item.product.images?.[0],
            price: item.price,
            quantity: item.quantity,
          })),
          status: ORDER_STATUS.PENDING,
          statusHistory: [{ status: ORDER_STATUS.PENDING, changedBy: req.user._id }],
          subtotal: group.subtotal,
          commissionAmount,
          vendorPayout,
        }], { session });
        subOrders.push(subOrder._id);
      }

      order.subOrders = subOrders;
      const reference = generatePaymentReference(order._id);
      order.paymentRef = reference;
      order.payment.reference = reference;
      await order.save({ session });

      // Simple stock reservation: decrement now. Production should add expiring stock holds for abandoned checkouts.
      await decrementStock(validatedItems, session);
    });
  } finally {
    await session.endSession();
  }

  const paystack = await initializePaystackTransaction({
    amount: order.totalAmount,
    email: req.user.email,
    reference: order.paymentRef,
    orderId: order._id,
  });

  res.status(201).json({
    orderId: order._id,
    reference: order.paymentRef,
    authorization_url: paystack.authorization_url,
  });
});

export const verifyCheckoutPayment = asyncHandler(async (req, res) => {
  const order = await verifyAndApplyPayment(req.params.reference, req.user?._id);
  if (order.customer.toString() !== req.user._id.toString()) {
    throw new AppError('Order not found', 404);
  }
  res.json({ order, paymentStatus: order.paymentStatus });
});

export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.body;
  if (!signature || !verifyPaystackSignature(rawBody, signature)) {
    return res.status(401).json({ message: 'Invalid Paystack signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid webhook body' });
  }

  res.sendStatus(200);

  if (event.event !== 'charge.success') {
    console.log(`Paystack webhook ignored: ${event.event}`);
    return;
  }

  try {
    const reference = event.data?.reference;
    const order = await Order.findOne({ paymentRef: reference });
    if (!order) return;
    const expectedAmount = Math.round(Number(order.totalAmount) * 100);
    if (Number(event.data?.amount) !== expectedAmount) {
      console.warn(`Paystack amount mismatch for ${reference}`);
      return;
    }
    await markOrderPaid(order);
  } catch (error) {
    console.error('Paystack webhook processing failed', error.message);
  }
});
