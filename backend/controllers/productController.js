import { ROLES, PRODUCT_STATUS } from '../constants/enums.js';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import {
  applyApprovedChanges,
  buildProductPayload,
  createPendingChanges,
  initialProductStatusFor,
  rejectPendingChanges,
} from '../services/productWorkflowService.js';

async function publicProductFilter(query) {
  const filter = { status: PRODUCT_STATUS.APPROVED, deletedAt: { $exists: false } };
  if (query.search) filter.$text = { $search: query.search };
  if (query.category) {
    const category = mongoose.Types.ObjectId.isValid(query.category)
      ? await Category.findById(query.category).select('_id')
      : await Category.findOne({ slug: query.category }).select('_id');
    if (!category) return { ...filter, _id: { $exists: false } };

    const children = await Category.find({ parent: category._id }).select('_id');
    const categoryIds = [category._id, ...children.map((child) => child._id)];
    filter.$or = [
      { category: { $in: categoryIds } },
      { categories: { $in: categoryIds } },
    ];
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }
  if (query.vendor) filter.vendor = query.vendor;
  if (query.minDiscountPercent !== undefined) {
    filter.compareAtPrice = { $gt: 0 };
    filter.$expr = {
      $gte: [
        { $multiply: [{ $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'] }, 100] },
        Number(query.minDiscountPercent),
      ],
    };
  }
  return filter;
}

function publicProductSort(query) {
  if (query.sort === 'price_asc') return { price: 1 };
  if (query.sort === 'price_desc') return { price: -1 };
  if (query.sort === 'discount_desc') {
    return { discountPercent: -1, createdAt: -1 };
  }
  return { createdAt: -1 };
}

function publicProductQuery(filter, query) {
  const base = Product.find(filter)
    .populate('vendor', 'storeName slug logoUrl ratingAvg')
    .populate('category', 'name slug')
    .populate('categories', 'name slug parent');

  if (query.sort === 'discount_desc') {
    return Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          discountPercent: {
            $cond: [
              { $gt: ['$compareAtPrice', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: publicProductSort(query) },
    ]);
  }

  return base.sort(publicProductSort(query));
}

export const listPublicProducts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const filter = await publicProductFilter(query);
  let products;
  let total;

  if (query.sort === 'discount_desc') {
    const [rows, countRows] = await Promise.all([
      publicProductQuery(filter, query).skip(skip).limit(limit),
      Product.aggregate([{ $match: filter }, { $count: 'total' }]),
    ]);
    products = await Product.populate(rows, [
      { path: 'vendor', select: 'storeName slug logoUrl ratingAvg' },
      { path: 'category', select: 'name slug' },
      { path: 'categories', select: 'name slug parent' },
    ]);
    total = countRows[0]?.total || 0;
  } else {
    [products, total] = await Promise.all([
      publicProductQuery(filter, query).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
  }
  res.json(paginatedResponse({ data: products, total, page, limit }));
});

export const listFlashSaleProducts = asyncHandler(async (req, res) => {
  const now = new Date();
  const products = await Product.find({
    status: PRODUCT_STATUS.APPROVED,
    deletedAt: { $exists: false },
    'flashSale.active': true,
    'flashSale.endsAt': { $gt: now },
  })
    .populate('vendor', 'storeName slug logoUrl ratingAvg')
    .populate('category', 'name slug')
    .populate('categories', 'name slug parent')
    .sort({ 'flashSale.endsAt': 1, createdAt: -1 })
    .limit(24);

  res.json({ data: products });
});

export const listTopSellerProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.validatedQuery?.limit || req.query.limit || 12);
  const liveFilter = { status: PRODUCT_STATUS.APPROVED, deletedAt: { $exists: false } };
  const hasSales = await Product.exists({ ...liveFilter, salesCount: { $gt: 0 } });
  const products = await Product.find(liveFilter)
    .populate('vendor', 'storeName slug logoUrl ratingAvg')
    .populate('category', 'name slug')
    .populate('categories', 'name slug parent')
    .sort(hasSales ? { salesCount: -1, createdAt: -1 } : { createdAt: -1 })
    .limit(limit);

  res.json({ data: products, isFallback: !hasSales });
});

export const getPublicProduct = asyncHandler(async (req, res) => {
  const lookup = mongoose.Types.ObjectId.isValid(req.params.productId)
    ? { _id: req.params.productId }
    : { slug: req.params.productId };
  const product = await Product.findOne({
    ...lookup,
    status: PRODUCT_STATUS.APPROVED,
    deletedAt: { $exists: false },
  }).populate('vendor', 'storeName slug logoUrl ratingAvg').populate('category', 'name slug').populate('categories', 'name slug parent');
  if (!product) throw new AppError('Product not found', 404);
  res.json({ product });
});

export const listVendorProducts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const filter = { vendor: req.vendor._id };
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').populate('categories', 'name slug parent').skip(skip).limit(limit).sort('-createdAt'),
    Product.countDocuments(filter),
  ]);
  res.json(paginatedResponse({ data: products, total, page, limit }));
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = buildProductPayload(req.body);
  if (!data.name && data.title) data.name = data.title;
  if (!data.title && data.name) data.title = data.name;
  if (!data.category && data.categories?.length) data.category = data.categories[0];
  const product = await Product.create({
    vendor: req.vendor._id,
    status: initialProductStatusFor(req.user),
    createdBy: req.user._id,
    createdByRole: req.user.role,
    pendingChanges: createPendingChanges({ action: 'create', data, user: req.user }),
    ...(req.user.role === ROLES.VENDOR_ADMIN ? data : {}),
  });

  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, vendor: req.vendor._id });
  if (!product) throw new AppError('Product not found', 404);

  const data = buildProductPayload(req.body);
  if (!data.name && data.title) data.name = data.title;
  if (!data.title && data.name) data.title = data.name;
  if (!data.category && data.categories?.length) data.category = data.categories[0];
  const status = initialProductStatusFor(req.user);

  if (product.status === PRODUCT_STATUS.APPROVED) {
    product.pendingChanges = createPendingChanges({ action: 'update', data, user: req.user, reviewStatus: status });
    product.history.push({ action: 'submit_update', data, changedBy: req.user._id });
  } else {
    product.pendingChanges = createPendingChanges({ action: 'update', data, user: req.user, reviewStatus: status });
    product.status = status;
    if (req.user.role === ROLES.VENDOR_ADMIN) Object.assign(product, data);
  }

  if (product.status !== PRODUCT_STATUS.APPROVED) product.status = status;
  await product.save();
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, vendor: req.vendor._id });
  if (!product) throw new AppError('Product not found', 404);

  if (product.status === PRODUCT_STATUS.APPROVED) {
    product.pendingChanges = createPendingChanges({
      action: 'delete',
      data: {},
      user: req.user,
      reviewStatus: initialProductStatusFor(req.user),
    });
    await product.save();
    return res.json({ product, message: 'Product deletion submitted for approval' });
  }

  await product.deleteOne();
  res.status(204).send();
});

export const listPendingVendorProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    vendor: req.vendor._id,
    'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_VENDOR,
  }).populate('createdBy', 'name email role');
  res.json({ products });
});

export const approveManagerProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    vendor: req.vendor._id,
    'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_VENDOR,
  });
  if (!product) throw new AppError('Pending manager product not found', 404);

  if (product.status !== PRODUCT_STATUS.APPROVED) product.status = PRODUCT_STATUS.PENDING_ADMIN;
  product.pendingChanges.reviewStatus = PRODUCT_STATUS.PENDING_ADMIN;
  product.pendingChanges.vendorReviewedBy = req.user._id;
  product.pendingChanges.vendorReviewedAt = new Date();
  await product.save();
  res.json({ product });
});

export const rejectManagerProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    vendor: req.vendor._id,
    'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_VENDOR,
  });
  if (!product) throw new AppError('Pending manager product not found', 404);

  rejectPendingChanges(product, req.user._id, req.body.reason || 'Rejected by Vendor Admin');
  await product.save();
  res.json({ product });
});

export const listPendingAdminProducts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, skip } = getPagination(query);
  const filter = { 'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_ADMIN };
  if (query.vendor) filter.vendor = query.vendor;

  const [products, total] = await Promise.all([
    Product.find(filter).populate('vendor', 'storeName').populate('createdBy', 'name email role').skip(skip).limit(limit).sort('-updatedAt'),
    Product.countDocuments(filter),
  ]);
  res.json(paginatedResponse({ data: products, total, page, limit }));
});

export const approveProductByAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_ADMIN,
  });
  if (!product) throw new AppError('Pending product not found', 404);

  product.pendingChanges.adminReviewedBy = req.user._id;
  product.pendingChanges.adminReviewedAt = new Date();
  applyApprovedChanges(product, req.user._id);
  await product.save();
  res.json({ product });
});

export const rejectProductByAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    'pendingChanges.reviewStatus': PRODUCT_STATUS.PENDING_ADMIN,
  });
  if (!product) throw new AppError('Pending product not found', 404);

  rejectPendingChanges(product, req.user._id, req.body.reason || 'Rejected by Super Admin');
  await product.save();
  res.json({ product });
});
