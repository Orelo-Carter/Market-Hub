import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createInviteJwt({ userId, vendorId, email }) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { tokenId, userId: userId.toString(), vendorId: vendorId.toString(), email },
    env.inviteTokenSecret,
    { expiresIn: '48h' },
  );

  return { token, tokenId, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) };
}

export function verifyInviteJwt(token) {
  return jwt.verify(token, env.inviteTokenSecret);
}
