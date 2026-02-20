/**
 * Razorpay Checkout (frontend only, test mode).
 * Loads checkout script and opens modal with order_id from backend.
 *
 * Wallet lifecycle: onSuccess is for UI only. Do NOT use it to update wallet or booking status;
 * backend webhook (payment.captured) is the single source of truth for wallet ledger.
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptLoadPromise = null;

/**
 * Load Razorpay checkout script once; returns Promise that resolves when window.Razorpay is available.
 * @returns {Promise<typeof window.Razorpay>}
 */
export function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Open Razorpay checkout with order from backend.
 * @param {Object} params
 * @param {string} params.key - Razorpay key ID (VITE_RAZORPAY_KEY_ID)
 * @param {Object} params.order - Order from POST /api/bookings/:id/pay { id, amount, currency, ... }
 * @param {string} [params.name] - Merchant name
 * @param {string} [params.description] - Order description
 * @param {(response: { razorpay_payment_id: string, razorpay_order_id: string }) => void} params.onSuccess
 * @param {() => void} params.onDismiss - Called when modal is closed without completing payment
 */
export function openRazorpayCheckout({ key, order, name = 'Best Choice Tutors', description = 'Tutoring session', onSuccess, onDismiss }) {
  if (!key || !order?.id) {
    throw new Error('Razorpay key and order id are required');
  }
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error('Razorpay script not loaded');
  }
  const options = {
    key,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency || 'GBP',
    name,
    description,
    handler(response) {
      onSuccess?.(response);
    },
    modal: {
      ondismiss() {
        onDismiss?.();
      },
    },
  };
  const rzp = new Razorpay(options);
  rzp.open();
}
