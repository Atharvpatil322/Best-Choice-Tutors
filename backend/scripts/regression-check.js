/**
 * Regression check: verify Stripe payment & earnings flow wiring.
 * Run from backend dir: node scripts/regression-check.js
 * Does NOT start the server or use DB/Stripe; only checks that modules load and key exports exist.
 */

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  checks.push({ name, ok: false, err: String(err?.message || err) });
  console.log(`  ✗ ${name}: ${err}`);
}

async function main() {
  console.log('Regression check: Stripe flows (module wiring)\n');

  // 1) Booking service exports
  try {
    const bookingService = await import('../services/bookingService.js');
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
      if (typeof bookingService[name] !== 'function') throw new Error(`Missing export: ${name}`);
    }
    pass('bookingService: all required exports present');
  } catch (e) {
    fail('bookingService load', e);
  }

  // 2) Stripe service exports
  try {
    const stripeService = await import('../services/stripeService.js');
    ['createCheckoutSession', 'verifyWebhookSignature', 'createRefund', 'createTransfer', 'createTransferReversal'].forEach((name) => {
      if (typeof stripeService[name] !== 'function') throw new Error(`Missing: ${name}`);
    });
    pass('stripeService: payment + transfer + reversal exports present');
  } catch (e) {
    fail('stripeService load', e);
  }

  // 3) Stripe Connect service
  try {
    const connectService = await import('../services/stripeConnectService.js');
    if (typeof connectService.getOrCreateStripeAccountForTutor !== 'function') throw new Error('Missing getOrCreateStripeAccountForTutor');
    if (typeof connectService.createPayoutOnboardingLink !== 'function') throw new Error('Missing createPayoutOnboardingLink');
    if (typeof connectService.updateTutorFromStripeAccount !== 'function') throw new Error('Missing updateTutorFromStripeAccount');
    pass('stripeConnectService: onboarding exports present');
  } catch (e) {
    fail('stripeConnectService load', e);
  }

  // 4) Dispute service (refund + reversal)
  try {
    const disputeService = await import('../services/disputeService.js');
    if (typeof disputeService.resolveDispute !== 'function') throw new Error('Missing resolveDispute');
    if (!disputeService.DISPUTE_OUTCOMES.includes('FULL_REFUND')) throw new Error('FULL_REFUND outcome missing');
    if (!disputeService.DISPUTE_OUTCOMES.includes('PARTIAL_REFUND')) throw new Error('PARTIAL_REFUND outcome missing');
    pass('disputeService: resolveDispute + outcomes');
  } catch (e) {
    fail('disputeService load', e);
  }

  // 5) Webhook controller (Stripe only)
  try {
    const webhookController = await import('../controllers/webhookController.js');
    if (typeof webhookController.handleStripeWebhook !== 'function') throw new Error('Missing handleStripeWebhook');
    if (webhookController.handleRazorpayWebhook !== undefined) throw new Error('Razorpay webhook should be removed');
    pass('webhookController: Stripe only, no Razorpay');
  } catch (e) {
    fail('webhookController load', e);
  }

  // 6) Webhook routes
  try {
    const webhookRoutes = await import('../routes/webhookRoutes.js');
    const router = webhookRoutes.default;
    const hasStripe = router.stack.some((l) => l.route?.path === '/stripe');
    const noRazorpay = !router.stack.some((l) => l.route?.path === '/razorpay');
    if (!hasStripe || !noRazorpay) throw new Error('Routes: expected /stripe, no /razorpay');
    pass('webhookRoutes: POST /stripe only');
  } catch (e) {
    fail('webhookRoutes check', e);
  }

  // 7) Booking model (Stripe fields, no Razorpay)
  try {
    const Booking = (await import('../models/Booking.js')).default;
    const schema = Booking.schema.obj;
    if (!schema.stripeSessionId || !schema.stripePaymentIntentId) throw new Error('Stripe fields missing on Booking');
    if (schema.razorpayOrderId || schema.razorpayPaymentId) throw new Error('Razorpay fields should be removed from Booking');
    pass('Booking model: Stripe fields present, no Razorpay');
  } catch (e) {
    fail('Booking model', e);
  }

  // 8) TutorEarnings has stripeTransferId
  try {
    const TutorEarnings = (await import('../models/TutorEarnings.js')).default;
    if (!TutorEarnings.schema.obj.stripeTransferId) throw new Error('stripeTransferId missing');
    pass('TutorEarnings: stripeTransferId present');
  } catch (e) {
    fail('TutorEarnings model', e);
  }

  // 9) Tutor has Stripe Connect fields, no razorpay
  try {
    const Tutor = (await import('../models/Tutor.js')).default;
    const schema = Tutor.schema.obj;
    if (!schema.stripeAccountId || !schema.stripeOnboardingStatus || schema.chargesEnabled === undefined) throw new Error('Stripe Connect fields missing');
    if (schema.razorpay) throw new Error('Tutor.razorpay should be removed');
    pass('Tutor model: Stripe Connect fields, no razorpay');
  } catch (e) {
    fail('Tutor model', e);
  }

  const failed = checks.filter((c) => !c.ok);
  console.log('\n' + (failed.length === 0 ? 'All checks passed.' : `Failed: ${failed.length}/${checks.length}`));
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
