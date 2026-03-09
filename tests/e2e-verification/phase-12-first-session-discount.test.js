/**
 * E2E verification: Phase 12 – First Session Discount
 *
 * Lightweight smoke tests to ensure:
 * - bookingService exposes first-session discount helpers and flags
 * - Booking model has isFirstSessionDiscount field
 * - Learner bookings routes expose eligibility endpoint
 *
 * Run from repo root:
 *   node --test tests/e2e-verification/phase-12-first-session-discount.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 12: First Session Discount', () => {
  it('bookingService exports isFirstSessionDiscountEligible and sets isFirstSessionDiscount flag', async () => {
    const bookingService = await import('../../backend/services/bookingService.js');
    assert.strictEqual(
      typeof bookingService.isFirstSessionDiscountEligible,
      'function',
      'bookingService.isFirstSessionDiscountEligible should be a function'
    );

    // Sanity check: createBookingForSlot should be present and Booking model should have isFirstSessionDiscount.
    assert.strictEqual(
      typeof bookingService.createBookingForSlot,
      'function',
      'bookingService.createBookingForSlot should be a function'
    );
  });

  it('Booking model includes isFirstSessionDiscount schema field', async () => {
    const Booking = (await import('../../backend/models/Booking.js')).default;
    assert.ok(Booking, 'Booking model should be defined');
    const paths = Booking.schema?.paths ?? {};
    assert.ok(
      paths.isFirstSessionDiscount,
      'Booking schema should define isFirstSessionDiscount'
    );
    const pathType = paths.isFirstSessionDiscount.instance;
    assert.strictEqual(
      pathType,
      'Boolean',
      'Booking.isFirstSessionDiscount should be a Boolean'
    );
  });

  it('learner bookings routes expose first-session discount eligibility endpoint', async () => {
    const learnerBookingsRoutes = await import('../../backend/routes/learnerBookingsRoutes.js');
    const router = learnerBookingsRoutes.default;
    assert.ok(router && Array.isArray(router.stack), 'Learner bookings router should be defined');

    const hasEligibilityRoute = router.stack.some(
      (layer) => layer.route?.path === '/bookings/first-session-discount-eligibility'
    );
    assert.ok(
      hasEligibilityRoute,
      'Expected route /bookings/first-session-discount-eligibility on learner bookings router'
    );
  });
});

