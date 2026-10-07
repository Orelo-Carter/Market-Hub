import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
    subOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SubOrder' },
    type: { type: String, default: 'order' },
    title: { type: String, required: true },
    message: String,
    readAt: Date,
  },
  { timestamps: true },
);

export const Notification = mongoose.model('Notification', notificationSchema);
