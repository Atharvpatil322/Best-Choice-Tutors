import {
  BookingError,
  updateBookingStatusFromStripeCheckoutSession,
  updateBookingStatusFromStripePaymentIntent,
} from '../services/bookingService.js';
import { verifyWebhookSignature as verifyStripeWebhookSignature } from '../services/stripeService.js';
import { updateTutorFromStripeAccount } from '../services/stripeConnectService.js';

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe
 *
 * Verification: STRIPE_WEBHOOK_SECRET (raw body + stripe-signature header).
 * Webhook is the source of truth; do not rely on frontend success callback.
 *
 * Events handled:
 * - checkout.session.completed: find by stripeSessionId → handleBookingPaid (idempotent)
 * - payment_intent.succeeded: find by stripePaymentIntentId → handleBookingPaid (idempotent)
 * - payment_intent.payment_failed: find by stripePaymentIntentId → handleBookingFailed (PENDING only)
 * - account.updated: find Tutor by stripeAccountId → update chargesEnabled, payoutsEnabled, stripeOnboardingStatus
 *
 * Duplicate events do not double-create TutorEarnings (handleBookingPaid is idempotent).
 */
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.header('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature) {
      return res.status(400).json({ message: 'Missing Stripe signature header' });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ message: 'Raw body required for Stripe webhook' });
    }

    let event;
    try {
      event = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    } catch (err) {
      console.warn('Stripe webhook: signature verification failed', { message: err.message });
      return res.status(400).json({ message: 'Invalid Stripe signature' });
    }

    console.info('Stripe webhook received', { type: event.type });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const result = await updateBookingStatusFromStripeCheckoutSession(session);
      if (result === null) {
        console.warn('Stripe webhook: booking not found for session_id', {
          session_id: session.id,
        });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const result = await updateBookingStatusFromStripePaymentIntent({
        paymentIntentId: paymentIntent.id,
        targetStatus: 'PAID',
      });
      if (result === null) {
        console.warn('Stripe webhook: booking not found for payment_intent_id', {
          payment_intent_id: paymentIntent.id,
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const result = await updateBookingStatusFromStripePaymentIntent({
        paymentIntentId: paymentIntent.id,
        targetStatus: 'FAILED',
      });
      if (result === null) {
        console.warn('Stripe webhook: booking not found for payment_intent_id', {
          payment_intent_id: paymentIntent.id,
        });
      }
    } else if (event.type === 'account.updated') {
      const account = event.data.object;
      const updated = await updateTutorFromStripeAccount(account);
      if (updated === null) {
        console.warn('Stripe webhook: tutor not found for account_id', { account_id: account.id });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof BookingError) {
      console.error('Stripe webhook: BookingError', { message: error.message });
      return res.status(200).json({ received: false, message: error.message });
    }
    next(error);
  }
};

