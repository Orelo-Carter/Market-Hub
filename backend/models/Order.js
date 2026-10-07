import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubOrder' }],
    shippingAddress: {
      name: String,
      phone: String,
      addressLine: String,
      city: String,
      state: String,
      country: String,
    },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
    paymentRef: { type: String, index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    payment: {
      provider: { type: String, default: 'manual' },
      reference: String,
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paidAt: Date,
    },
    total: { type: Number, min: 0 },
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
