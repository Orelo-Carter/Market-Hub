import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    permissions: {
      canCreateProduct: { type: Boolean, default: false },
      canEditProduct: { type: Boolean, default: false },
      canDeleteProduct: { type: Boolean, default: false },
      canViewOrders: { type: Boolean, default: false },
      canManageOrders: { type: Boolean, default: false },
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedAt: Date,
  },
  { timestamps: true },
);

managerSchema.index({ vendor: 1, user: 1 }, { unique: true });

export const Manager = mongoose.model('Manager', managerSchema);
