import mongoose from 'mongoose';
import { PRODUCT_STATUS } from '../constants/enums.js';

const variantOptionSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    priceModifier: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    options: [variantOptionSchema],
  },
  { _id: false },
);

const productChangeSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['create', 'update', 'delete'], default: 'create' },
    data: {
      name: String,
      title: String,
      description: String,
      price: Number,
      compareAtPrice: Number,
      stock: Number,
      sku: String,
      images: [String],
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      variants: [variantSchema],
      flashSale: {
        active: { type: Boolean, default: false },
        endsAt: { type: Date, default: null },
      },
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedRole: String,
    submittedAt: { type: Date, default: Date.now },
    reviewStatus: { type: String, enum: Object.values(PRODUCT_STATUS), index: true },
    vendorReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vendorReviewedAt: Date,
    adminReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminReviewedAt: Date,
    rejectionReason: String,
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, trim: true },
    title: { type: String, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true, index: true },
    description: { type: String, trim: true },
    price: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    sku: { type: String, trim: true },
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
    variants: [variantSchema],
    flashSale: {
      active: { type: Boolean, default: false },
      endsAt: { type: Date, default: null },
    },
    salesCount: { type: Number, default: 0, min: 0, index: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(PRODUCT_STATUS), required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByRole: String,
    pendingChanges: productChangeSchema,
    rejectionReason: String,
    deletedAt: Date,
    history: [
      {
        action: String,
        data: mongoose.Schema.Types.Mixed,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', title: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
