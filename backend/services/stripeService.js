/**
 * Stripe Service
 * Dedicated service for Stripe SDK initialization and payment/Connect helpers.
 * Stripe-only payments, Connect onboarding, and transfers.
 */

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Lazily-initialized Stripe instance. Throws if STRIPE_SECRET_KEY is not set when used.
 * @returns {Stripe}
 */
const getStripe = () => {
  if (!secretKey || typeof secretKey !== 'string' || !secretKey.trim()) {
    throw new Error(
      'Stripe secret key is not configured. Please set STRIPE_SECRET_KEY in environment.'
    );
  }
  return new Stripe(secretKey.trim());
};

/** Reusable Stripe instance (lazy). Use getStripe() for access. */
let stripeInstance = null;

/**
 * Get the Stripe client instance. Creates it on first use.
 * @returns {Stripe}
 */
export const getStripeClient = () => {
  if (!stripeInstance) {
    stripeInstance = getStripe();
  }
  return stripeInstance;
};

/**
 * Create a Checkout Session (hosted payment page).
 * @param {Object} params
 * @param {number} params.amount - Amount in smallest currency unit (e.g. pence for GBP)
 * @param {string} params.currency - Currency code (e.g. 'gbp')
 * @param {string} [params.successUrl] - Redirect URL on success
 * @param {string} [params.cancelUrl] - Redirect URL on cancel
 * @param {string} [params.clientReferenceId] - Your reference (e.g. booking ID)
 * @param {string} [params.customerEmail] - Prefill customer email
 * @param {Object} [params.metadata] - Key-value metadata attached to the session
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const createCheckoutSession = async ({
  amount,
  currency,
  successUrl,
  cancelUrl,
  clientReferenceId,
  customerEmail,
  metadata = {},
  paymentIntentMetadata = {},
}) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (currency || 'gbp').toLowerCase(),
          unit_amount: amount,
          product_data: {
            name: 'Tutoring session',
            description: 'Best Choice Tutors – session booking',
          },
        },
      },
    ],
    ...(successUrl && { success_url: successUrl }),
    ...(cancelUrl && { cancel_url: cancelUrl }),
    ...(clientReferenceId && { client_reference_id: clientReferenceId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
    ...(Object.keys(paymentIntentMetadata).length > 0 && {
      payment_intent_data: {
        metadata: paymentIntentMetadata,
      },
    }),
  });
  return session;
};

/**
 * Find a Checkout Session by PaymentIntent ID.
 * Useful as fallback in webhooks when payment_intent events arrive but booking lacks stored stripePaymentIntentId.
 *
 * @param {string} paymentIntentId - Stripe PaymentIntent ID (e.g. pi_xxx)
 * @returns {Promise<Stripe.Checkout.Session|null>}
 */
export const findCheckoutSessionByPaymentIntentId = async (paymentIntentId) => {
  if (!paymentIntentId) return null;
  const stripe = getStripeClient();
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  return sessions?.data?.[0] ?? null;
};

/**
 * Create a PaymentIntent (for custom UI / Stripe Elements).
 * @param {Object} params
 * @param {number} params.amount - Amount in smallest currency unit
 * @param {string} params.currency - Currency code (e.g. 'gbp')
 * @param {string} [params.receiptEmail] - Receipt email
 * @param {Object} [params.metadata] - Key-value metadata
 * @returns {Promise<Stripe.PaymentIntent>}
 */
export const createPaymentIntent = async ({
  amount,
  currency,
  receiptEmail,
  metadata = {},
}) => {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: (currency || 'gbp').toLowerCase(),
    automatic_payment_methods: { enabled: true },
    ...(receiptEmail && { receipt_email: receiptEmail }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
  });
  return paymentIntent;
};

/**
 * Verify Stripe webhook signature. Use the raw request body (Buffer or string).
 * @param {Buffer|string} rawBody - Raw body from the webhook request (req.rawBody)
 * @param {string} signature - Value of the 'stripe-signature' header
 * @param {string} webhookSecret - Stripe webhook signing secret (STRIPE_WEBHOOK_SECRET)
 * @returns {Stripe.Event} Decoded and verified event
 * @throws {Error} If secret not set or signature invalid
 */
export const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  if (!webhookSecret || typeof webhookSecret !== 'string' || !webhookSecret.trim()) {
    throw new Error(
      'Stripe webhook secret is not configured. Please set STRIPE_WEBHOOK_SECRET in environment.'
    );
  }
  if (!signature) {
    throw new Error('Missing Stripe signature header');
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret.trim()
  );
};

/**
 * Create a refund for a PaymentIntent.
 * @param {Object} params
 * @param {string} params.paymentIntentId - Stripe PaymentIntent ID (e.g. pi_xxx)
 * @param {number} [params.amount] - Amount in smallest currency unit; omit for full refund
 * @param {string} [params.reason] - 'duplicate' | 'fraudulent' | 'requested_by_customer'
 * @returns {Promise<Stripe.Refund>}
 */
export const createRefund = async ({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
}) => {
  const stripe = getStripeClient();
  const options = {
    payment_intent: paymentIntentId,
    reason,
  };
  if (amount != null && amount > 0) {
    options.amount = amount;
  }
  return stripe.refunds.create(options);
};

/**
 * Create a Stripe Connect Express account (for payouts to tutors).
 * @param {Object} params
 * @param {string} [params.email] - Account email
 * @param {string} [params.country] - Country code (e.g. 'GB')
 * @param {Object} [params.metadata] - e.g. { tutorId: '...' }
 * @returns {Promise<Stripe.Account>}
 */
/**
 * Retrieve a Connect account by ID. Throws if account does not exist (e.g. deleted in Dashboard).
 * @param {string} accountId - Stripe Connect account ID (acct_xxx)
 * @returns {Promise<Stripe.Account>}
 */
export const retrieveConnectedAccount = async (accountId) => {
  const stripe = getStripeClient();
  return stripe.accounts.retrieve(accountId);
};

export const createConnectedAccount = async ({
  email,
  country = 'GB',
  metadata = {},
}) => {
  const stripe = getStripeClient();
  const account = await stripe.accounts.create({
    type: 'express',
    country: (country || 'GB').toUpperCase(),
    ...(email && { email: email.trim() }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
  });
  return account;
};

/**
 * Create an Account Link for Connect onboarding (redirect tutor to Stripe).
 * @param {Object} params
 * @param {string} params.accountId - Stripe Connect account ID (e.g. acct_xxx)
 * @param {string} params.refreshUrl - URL to redirect if link expires
 * @param {string} params.returnUrl - URL to redirect after onboarding
 * @returns {Promise<Stripe.AccountLink>}
 */
export const createAccountLink = async ({ accountId, refreshUrl, returnUrl }) => {
  const stripe = getStripeClient();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return accountLink;
};

/**
 * Create a transfer to a Connect account (e.g. pay out tutor earnings).
 * @param {Object} params
 * @param {number} params.amount - Amount in smallest currency unit (positive integer)
 * @param {string} params.currency - Currency code (e.g. 'gbp')
 * @param {string} params.destinationAccountId - Stripe Connect account ID (acct_xxx)
 * @param {string} [params.transferGroup] - Optional idempotency/grouping key
 * @param {Object} [params.metadata] - Optional metadata
 * @returns {Promise<Stripe.Transfer>}
 */
export const createTransfer = async ({
  amount,
  currency,
  destinationAccountId,
  transferGroup,
  metadata = {},
}) => {
  const stripe = getStripeClient();
  const params = {
    amount,
    currency: (currency || 'gbp').toLowerCase(),
    destination: destinationAccountId,
    ...(transferGroup && { transfer_group: transferGroup }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
  };
  return stripe.transfers.create(params);
};

/**
 * Create a transfer reversal (e.g. when FULL_REFUND after payout).
 * @param {string} transferId - Stripe Transfer ID (e.g. tr_xxx)
 * @param {number} [amount] - Amount in smallest currency unit; omit for full reversal
 * @returns {Promise<Stripe.TransferReversal>}
 */
export const createTransferReversal = async (transferId, { amount } = {}) => {
  const stripe = getStripeClient();
  const options = amount != null && amount > 0 ? { amount } : {};
  return stripe.transfers.createReversal(transferId, options);
};

/**
 * Retrieve a payout by ID with expanded balance transaction.
 * This helps identify which connected account was paid for manual payouts.
 * @param {string} payoutId - Stripe payout ID (e.g. po_xxx)
 * @returns {Promise<Stripe.Payout>}
 */
export const retrievePayout = async (payoutId) => {
  const stripe = getStripeClient();
  return stripe.payouts.retrieve(payoutId, {
    expand: ['balance_transaction'],
  });
};

/**
 * Retrieve external accounts (bank accounts/cards) for a Connect account.
 * @param {string} accountId - Stripe Connect account ID (acct_xxx)
 * @returns {Promise<Stripe.ApiList<Stripe.BankAccount|Stripe.Card>>}
 */
export const retrieveAccountExternalAccounts = async (accountId) => {
  const stripe = getStripeClient();
  return stripe.accounts.listExternalAccounts(accountId);
};

/**
 * Retrieve current balance for a connected account.
 * @param {string} accountId - Stripe Connect account ID (acct_xxx)
 * @returns {Promise<Stripe.Balance>}
 */
export const retrieveConnectedAccountBalance = async (accountId) => {
  const stripe = getStripeClient();
  return stripe.balance.retrieve({}, { stripeAccount: accountId });
};

/**
 * List payouts for a connected account.
 * @param {string} accountId - Stripe Connect account ID (acct_xxx)
 * @param {{ limit?: number, startingAfter?: string }} [opts]
 * @returns {Promise<Stripe.ApiList<Stripe.Payout>>}
 */
export const listConnectedAccountPayouts = async (accountId, opts = {}) => {
  const stripe = getStripeClient();
  return stripe.payouts.list(
    {
      limit: opts.limit ?? 100,
      ...(opts.startingAfter ? { starting_after: opts.startingAfter } : {}),
    },
    { stripeAccount: accountId }
  );
};

/**
 * Retrieve a transfer by ID.
 * @param {string} transferId - Stripe Transfer ID (e.g. tr_xxx)
 * @returns {Promise<Stripe.Transfer>}
 */
export const retrieveTransfer = async (transferId) => {
  const stripe = getStripeClient();
  return stripe.transfers.retrieve(transferId);
};

export default {
  getStripeClient,
  createCheckoutSession,
  findCheckoutSessionByPaymentIntentId,
  createPaymentIntent,
  verifyWebhookSignature,
  createRefund,
  createConnectedAccount,
  createAccountLink,
  createTransfer,
  createTransferReversal,
  retrieveConnectedAccountBalance,
  listConnectedAccountPayouts,
  retrieveTransfer,
};
