import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function requirePaystackSecret() {
  if (!env.paystack.secretKey) throw new AppError('PAYSTACK_SECRET_KEY is not configured', 500);
  return env.paystack.secretKey;
}

async function paystackRequest(path, options = {}) {
  const secretKey = requirePaystackSecret();
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) {
    throw new AppError(payload.message || 'Paystack request failed', response.status || 502);
  }
  return payload.data;
}

export function verifyPaystackSignature(rawBody, signature) {
  const secretKey = requirePaystackSecret();
  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return hash === signature;
}

export function generatePaymentReference(orderId) {
  return `mh_${orderId}_${crypto.randomBytes(6).toString('hex')}`;
}

export function initializePaystackTransaction({ amount, email, reference, orderId }) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      email,
      reference,
      callback_url: `${env.frontendUrl}/checkout/verify?reference=${encodeURIComponent(reference)}`,
      metadata: { orderId },
    }),
  });
}

export function verifyPaystackTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}
