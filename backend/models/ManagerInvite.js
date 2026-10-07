import mongoose from 'mongoose';

const managerInviteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    tokenId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: Date,
  },
  { timestamps: true },
);

export const ManagerInvite = mongoose.model('ManagerInvite', managerInviteSchema);
