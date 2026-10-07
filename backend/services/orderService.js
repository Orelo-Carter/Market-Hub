import mongoose from 'mongoose';
import { PRODUCT_STATUS } from '../constants/enums.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

export async function checkoutCart(customerId, payment = {}) {
  const cart = await Cart.findOne({ customer: customerId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  const grouped = new Map();
  const productUpdates = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product || product.status !== PRODUCT_STATUS.APPROVED || product.deletedAt) {
      throw new AppError('Cart contains unavailable products', 400);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Not enough stock for ${product.name}`, 400);
    }

    const vendorId = product.vendor.toString();
    const lineTotal = product.price * item.quantity;
    const orderItem = {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal,
    };

    if (!grouped.has(vendorId)) {
      grouped.set(vendorId, { vendor: product.vendor, items: [], total: 0 });
    }

    grouped.get(vendorId).items.push(orderItem);
    grouped.get(vendorId).total += lineTotal;
    productUpdates.push({ productId: product._id, quantity: item.quantity });
  }

  const session = await mongoose.startSession();
  let order;

  await session.withTransaction(async () => {
    for (const update of productUpdates) {
      const result = await Product.updateOne(
        { _id: update.productId, stock: { $gte: update.quantity } },
        { $inc: { stock: -update.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1) throw new AppError('Stock changed before checkout completed', 409);
    }

    const subOrders = [...grouped.values()].map((subOrder) => ({
      ...subOrder,
      statusHistory: [{ status: 'pending', changedBy: customerId }],
    }));

    const total = subOrders.reduce((sum, subOrder) => sum + subOrder.total, 0);
    [order] = await Order.create([{
      customer: customerId,
      subOrders,
      total,
      payment: {
        provider: payment.provider || 'manual',
        reference: payment.reference,
        status: payment.status || 'pending',
        paidAt: payment.status === 'paid' ? new Date() : undefined,
      },
    }], { session });

    cart.items = [];
    await cart.save({ session });
  });

  await session.endSession();
  return order.populate('subOrders.vendor subOrders.items.product');
}
