import { PRODUCT_STATUS } from '../constants/enums.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function getOrCreateCart(customerId) {
  return Cart.findOneAndUpdate(
    { customer: customerId },
    { $setOnInsert: { customer: customerId, items: [] } },
    { upsert: true, new: true },
  ).populate('items.product');
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ cart });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.body.productId,
    status: PRODUCT_STATUS.APPROVED,
    deletedAt: { $exists: false },
  });
  if (!product) throw new AppError('Product is not available', 404);
  if (product.stock < req.body.quantity) throw new AppError('Not enough stock', 400);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => item.product._id.toString() === product._id.toString());
  if (existing) {
    existing.quantity += req.body.quantity;
  } else {
    cart.items.push({ product: product._id, quantity: req.body.quantity });
  }
  await cart.save();
  await cart.populate('items.product');
  res.status(201).json({ cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((cartItem) => cartItem.product._id.toString() === req.params.productId);
  if (!item) throw new AppError('Cart item not found', 404);

  item.quantity = req.body.quantity;
  await cart.save();
  await cart.populate('items.product');
  res.json({ cart });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((item) => item.product._id.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ cart });
});

export const checkout = asyncHandler(async (req, res) => {
  throw new AppError('Use POST /api/checkout for Paystack checkout', 410);
});
