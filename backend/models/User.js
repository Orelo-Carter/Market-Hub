import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ROLES, USER_STATUS } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE, index: true },
    isActive: { type: Boolean, default: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    permissions: {
      canCreateProduct: { type: Boolean, default: false },
      canEditProduct: { type: Boolean, default: false },
      canDeleteProduct: { type: Boolean, default: false },
      canViewOrders: { type: Boolean, default: false },
    },
    inviteTokenHash: { type: String, select: false },
    inviteExpiresAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.inviteTokenHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
