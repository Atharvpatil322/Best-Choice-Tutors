import {
  BookingError,
  updateBookingStatusFromStripeCheckoutSession,
  updateBookingStatusFromStripePaymentIntent,
} from '../services/bookingService.js';
import { verifyWebhookSignature as verifyStripeWebhookSignature } from '../services/stripeService.js';
import { updateTutorFromStripeAccount } from '../services/stripeConnectService.js';
import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';

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
      console.warn('Stripe webhook: missing stripe-signature header');
      return res.status(400).json({ message: 'Missing Stripe signature header' });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      console.warn('Stripe webhook: raw body missing (check webhook route is not parsed by body parser before raw capture)');
      return res.status(400).json({ message: 'Raw body required for Stripe webhook' });
    }

    if (!webhookSecret || !webhookSecret.trim()) {
      console.warn('Stripe webhook: STRIPE_WEBHOOK_SECRET is not set in .env');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    } catch (err) {
      console.warn('Stripe webhook: signature verification failed', { message: err.message });
      return res.status(400).json({ message: 'Invalid Stripe signature' });
    }

    console.info('Stripe webhook received', { 
      type: event.type, 
      account: event.account,
      api_version: event.api_version 
    });

    // Debug: Log full event structure for payout events
    if (event.type?.startsWith('payout')) {
      console.info('Stripe webhook: FULL payout event', {
        type: event.type,
        data: JSON.stringify(event.data.object),
        account: event.account,
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const result = await updateBookingStatusFromStripeCheckoutSession(session);
      if (result === null) {
        console.warn('Stripe webhook: booking not found for session_id', {
          session_id: session.id,
        });
      } else {
        console.info('Stripe webhook: booking marked PAID', { bookingId: result._id?.toString?.() || result.id });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const result = await updateBookingStatusFromStripePaymentIntent({
        paymentIntentId: paymentIntent.id,
        targetStatus: 'PAID',
        bookingIdHint: paymentIntent?.metadata?.bookingId || paymentIntent?.metadata?.booking_id,
      });
      if (result === null) {
        console.warn('Stripe webhook: booking not found for payment_intent_id', {
          payment_intent_id: paymentIntent.id,
        });
      } else {
        console.info('Stripe webhook: booking marked PAID (via payment_intent)', { bookingId: result._id?.toString?.() || result.id });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const result = await updateBookingStatusFromStripePaymentIntent({
        paymentIntentId: paymentIntent.id,
        targetStatus: 'FAILED',
        bookingIdHint: paymentIntent?.metadata?.bookingId || paymentIntent?.metadata?.booking_id,
      });
      if (result === null) {
        console.warn('Stripe webhook: booking not found for payment_intent_id', {
          payment_intent_id: paymentIntent.id,
        });
      }
    } else if (event.type === 'account.updated' || event.type === 'connect.account.updated') {
      const account = event.data.object;
      const updated = await updateTutorFromStripeAccount(account);
      if (updated === null) {
        console.warn('Stripe webhook: tutor not found for account_id', { account_id: account.id });
      } else {
        console.info('Stripe webhook: tutor Connect status updated', {
          tutorId: updated._id?.toString(),
          stripeOnboardingStatus: updated.stripeOnboardingStatus,
          payoutsEnabled: updated.payoutsEnabled,
        });
      }
    } else if (event.type === 'payout.paid') {
      const payout = event.data.object;
      
      // For manual payouts from Stripe Dashboard, we need to find the tutor by their payout account ID
      // The payout.destination is the bank account ID (ba_xxx)
      const payoutDestination = payout.destination;

      console.info('Stripe webhook: Payout paid', {
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        destination: payoutDestination,
      });

      let tutor = null;
      
      // First try: Find by event.account (connected account ID)
      if (event.account) {
        tutor = await Tutor.findOne({ stripeAccountId: event.account });
      }
      
      // Second try: If event.account is not available, try to find by payout destination (bank account)
      // This handles manual payouts from Stripe Dashboard
      if (!tutor && payoutDestination) {
        tutor = await Tutor.findOne({ stripePayoutAccountId: payoutDestination });
        if (tutor) {
          console.info('Stripe webhook: Found tutor by payout account ID', {
            tutorId: tutor._id.toString(),
            payoutAccountId: payoutDestination,
          });
        }
      }

      if (!tutor) {
        console.warn('Stripe webhook: tutor not found for payout', {
          payoutId: payout.id,
          destination: payoutDestination,
          eventAccount: event.account,
        });
      } else {
        // Update all available earnings entries for this tutor that haven't been paid out yet
        // This handles manual payouts from Stripe Dashboard
        let paidAt;
        if (payout.arrival_date) {
          paidAt = new Date(payout.arrival_date * 1000); // Stripe uses Unix timestamp
        } else {
          paidAt = new Date(); // Fallback to current time
        }

        const result = await TutorEarnings.updateMany(
          {
            tutorId: tutor._id,
            status: 'available',
            payoutId: null,
          },
          {
            $set: {
              payoutId: payout.id,
              paidAt,
            },
          }
        );

        console.info('Stripe webhook: payout recorded', {
          tutorId: tutor._id.toString(),
          payoutId: payout.id,
          entriesUpdated: result.modifiedCount,
        });
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
