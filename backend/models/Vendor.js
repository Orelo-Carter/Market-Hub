import mongoose from 'mongoose';
import { VENDOR_STATUS } from '../constants/enums.js';

const vendorSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, unique: true, sparse: true, index: true },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    logo: { type: String, trim: true },
    banner: { type: String, trim: true },
    payoutDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountName: { type: String, trim: true },
    },
    commissionRate: { type: Number, default: 0.1, min: 0, max: 1 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: Object.values(VENDOR_STATUS), default: VENDOR_STATUS.PENDING, index: true },
    rejectionReason: String,
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }],
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suspendedAt: Date,
  },
  { timestamps: true },
);

export const Vendor = mongoose.model('Vendor', vendorSchema);
