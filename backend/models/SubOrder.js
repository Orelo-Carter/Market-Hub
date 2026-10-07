import mongoose from 'mongoose';
import { ORDER_STATUS } from '../constants/enums.js';

const subOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: mongoose.Schema.Types.Mixed,
    name: String,
    image: String,
    price: Number,
    quantity: Number,
  },
  { _id: false },
);

const subOrderSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [subOrderItemSchema],
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
        trackingNumber: String,
        carrier: String,
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    vendorPayout: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const SubOrder = mongoose.model('SubOrder', subOrderSchema);
