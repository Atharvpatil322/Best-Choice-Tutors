/**
 * E2E verification: Phase 7 – Regression
 *
 * Smoke and regression checks: module wiring, no removed integrations (e.g. Razorpay), key flows intact.
 * Uses real backend modules; no mocks of business logic. Aligns with backend/scripts/regression-check.js intent.
 * Run from repo root: node --test tests/e2e-verification/phase-7-regression.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 7: Regression', () => {
  describe('Booking and Stripe flow wiring', () => {
    it('bookingService has all required exports for Stripe flow', async () => {
      const bookingService = await import('../../backend/services/bookingService.js');
      const required = [
        'createBookingForSlot',
        'createPaymentOrderForBooking',
        'handleBookingPaid',
        'handleBookingFailed',
        'updateBookingStatusFromStripeCheckoutSession',
        'updateBookingStatusFromStripePaymentIntent',
        'releaseWalletForBooking',
        'releaseWalletForBookingInternal',
        'releasePartialToTutor',
        'markTutorEarningsRefunded',
        'completeEligibleBookings',
      ];
      for (const name of required) {
        assert.strictEqual(typeof bookingService[name], 'function', `Missing export: ${name}`);
      }
      // Expected: full booking → payment → release flow can run without missing functions.
    });

    it('stripeService has payment, transfer, refund, reversal, Connect exports', async () => {
      const stripeService = await import('../../backend/services/stripeService.js');
      assert.strictEqual(typeof stripeService.createCheckoutSession, 'function');
      assert.strictEqual(typeof stripeService.verifyWebhookSignature, 'function');
      assert.strictEqual(typeof stripeService.createRefund, 'function');
      assert.strictEqual(typeof stripeService.createTransfer, 'function');
      assert.strictEqual(typeof stripeService.createTransferReversal, 'function');
      assert.strictEqual(typeof stripeService.createConnectedAccount, 'function');
      assert.strictEqual(typeof stripeService.createAccountLink, 'function');
      // Expected: no regression to Razorpay; all Stripe operations available.
    });
  });

  describe('Webhook routes: Stripe only', () => {
    it('webhook routes expose POST /stripe and do not expose /razorpay', async () => {
      const webhookRoutes = await import('../../backend/routes/webhookRoutes.js');
      const router = webhookRoutes.default;
      assert.ok(router && Array.isArray(router.stack));
      const hasStripe = router.stack.some((l) => l.route?.path === '/stripe');
      const noRazorpay = !router.stack.some((l) => l.route?.path === '/razorpay');
      assert.ok(hasStripe, 'Expected route /stripe');
      assert.ok(noRazorpay, 'Expected no /razorpay route');
      // Expected: Stripe-only webhook; Razorpay fully removed.
    });
  });

  describe('Connect services', () => {
    it('stripeConnectService onboarding exports present', async () => {
      const connectService = await import('../../backend/services/stripeConnectService.js');
      assert.strictEqual(typeof connectService.getOrCreateStripeAccountForTutor, 'function');
      assert.strictEqual(typeof connectService.createPayoutOnboardingLink, 'function');
      assert.strictEqual(typeof connectService.updateTutorFromStripeAccount, 'function');
      // Expected: tutor onboarding and account.updated handling intact.
    });
  });

  describe('Key models exist', () => {
    it('Booking, TutorEarnings, Tutor, User models load', async () => {
      const Booking = (await import('../../backend/models/Booking.js')).default;
      const TutorEarnings = (await import('../../backend/models/TutorEarnings.js')).default;
      const Tutor = (await import('../../backend/models/Tutor.js')).default;
      const User = (await import('../../backend/models/User.js')).default;
      assert.ok(Booking);
      assert.ok(TutorEarnings);
      assert.ok(Tutor);
      assert.ok(User);
      // Expected: no accidental removal of core models.
    });
  });
});
