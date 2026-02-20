import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

// Lazily initialize Razorpay client with TEST keys from environment
const getRazorpayClient = () => {
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * Create a Razorpay order.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in smallest currency unit (pence for GBP)
 * @param {string} params.currency - Currency code (e.g., 'GBP')
 * @param {string} params.receipt - Receipt identifier (e.g., booking ID)
 * @returns {Promise<Object>} Razorpay order object
 */
export const createRazorpayOrder = async ({ amount, currency, receipt }) => {
  const options = {
    amount,
    currency,
    receipt,
  };

  const razorpayClient = getRazorpayClient();
  const order = await razorpayClient.orders.create(options);
  return order;
};

/**
 * Verify Razorpay webhook signature using the shared secret.
 *
 * @param {string} payloadBody - Raw request body string
 * @param {string} signature - Signature from 'x-razorpay-signature' header
 * @returns {boolean} Whether the signature is valid
 */
export const verifyRazorpayWebhookSignature = (payloadBody, signature) => {
  if (!webhookSecret) {
    console.warn(
      'RAZORPAY_WEBHOOK_SECRET is not set; webhook signature verification will fail. Set RAZORPAY_WEBHOOK_SECRET in environment.'
    );
    throw new Error('Razorpay webhook secret is not configured. Please set RAZORPAY_WEBHOOK_SECRET.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadBody)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Create a refund for a captured payment.
 *
 * @param {Object} params
 * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_xxx)
 * @param {number} [params.amount] - Amount in smallest currency unit (pence for GBP). Omit for full refund.
 * @returns {Promise<Object>} Razorpay refund object
 */
export const createRefund = async ({ paymentId, amount }) => {
  const razorpayClient = getRazorpayClient();
  const options = amount != null ? { amount } : {};
  const refund = await razorpayClient.payments.refund(paymentId, options);
  return refund;
};


