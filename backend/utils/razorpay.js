/**
 * Razorpay REST helper.
 *
 * Uses the Razorpay HTTP API directly (Node 18+ global fetch), so no extra
 * npm dependency is required. Works with both Test and Live keys.
 *
 * Required env vars (see .env.example):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET   (optional, only for webhook verification)
 */
const crypto = require('crypto');

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

const getKeys = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return { keyId, keySecret };
};

const isConfigured = () => {
  const { keyId, keySecret } = getKeys();
  return Boolean(keyId && keySecret);
};

const authHeader = () => {
  const { keyId, keySecret } = getKeys();
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
};

const request = async (path, options = {}) => {
  if (!isConfigured()) {
    const err = new Error(
      'Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env'
    );
    err.statusCode = 503;
    throw err;
  }

  const res = await fetch(`${RAZORPAY_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      (data && data.error && data.error.description) ||
      `Razorpay request failed with status ${res.status}`;
    const err = new Error(message);
    err.statusCode = res.status === 401 ? 500 : 502;
    throw err;
  }

  return data;
};

/**
 * Create a Razorpay order. Amount must be in rupees; converted to paise here.
 */
const createOrder = async ({ amountInRupees, receipt, notes }) => {
  const amount = Math.round(Number(amountInRupees) * 100);
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: (receipt || '').toString().slice(0, 40),
      payment_capture: 1,
      notes: notes || {}
    })
  });
};

/** Fetch a payment object from Razorpay (used to confirm amount + status). */
const fetchPayment = async (razorpayPaymentId) =>
  request(`/payments/${razorpayPaymentId}`, { method: 'GET' });

/**
 * Verify the checkout handler signature:
 * HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = getKeys();
  if (!keySecret || !orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Verify a Razorpay webhook payload signature against the raw request body. */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret || !signature || !rawBody) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Map a Razorpay payment method code to the label stored on our Payment model. */
const mapMethod = (rzpPayment = {}) => {
  switch (rzpPayment.method) {
    case 'card':
      return 'Card';
    case 'upi':
      // QR payments arrive as UPI with a qr_code reference on the payment object
      return rzpPayment.acquirer_data && rzpPayment.acquirer_data.rrn && rzpPayment.description &&
        /qr/i.test(rzpPayment.description)
        ? 'QR'
        : 'UPI';
    case 'netbanking':
      return 'Net Banking';
    case 'wallet':
      return 'Wallet';
    case 'emi':
      return 'Card';
    default:
      return 'UPI';
  }
};

module.exports = {
  isConfigured,
  getKeys,
  createOrder,
  fetchPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  mapMethod
};
