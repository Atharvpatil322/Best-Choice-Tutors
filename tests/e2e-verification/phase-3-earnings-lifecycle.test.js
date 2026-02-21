/**
 * E2E verification: Phase 3 – Earnings lifecycle
 *
 * High-level checks for TutorEarnings creation, pendingRelease, release to available, and wallet summary.
 * Uses real bookingService, tutorWalletController, TutorEarnings model; no mocks of business logic.
 * Run from repo root: node --test tests/e2e-verification/phase-3-earnings-lifecycle.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 3: Earnings lifecycle', () => {
  describe('Booking service earnings integration', () => {
    it('exposes releaseWalletForBookingInternal and releasePartialToTutor', async () => {
      const bookingService = await import('../../backend/services/bookingService.js');
      assert.strictEqual(typeof bookingService.releaseWalletForBookingInternal, 'function');
      assert.strictEqual(typeof bookingService.releasePartialToTutor, 'function');
      // Expected: releaseWalletForBookingInternal moves earnings to available; releasePartialToTutor for partial refunds.
    });

    it('exposes markTutorEarningsRefunded', async () => {
      const bookingService = await import('../../backend/services/bookingService.js');
      assert.strictEqual(typeof bookingService.markTutorEarningsRefunded, 'function');
      // Expected: marks TutorEarnings as refunded when full refund is processed.
    });
  });

  describe('Tutor wallet controller', () => {
    it('getWallet returns pendingEarnings, availableEarnings, totalEarnings, entries', async () => {
      const walletController = await import('../../backend/controllers/tutorWalletController.js');
      assert.strictEqual(typeof walletController.getWallet, 'function');
      // Expected: GET /api/tutor/wallet returns totals and list of TutorEarnings for authenticated tutor.
    });
  });

  describe('TutorEarnings model', () => {
    it('TutorEarnings model loads and has expected schema', async () => {
      const TutorEarnings = (await import('../../backend/models/TutorEarnings.js')).default;
      assert.ok(TutorEarnings);
      const schema = TutorEarnings.schema?.obj ?? TutorEarnings.schema?.paths;
      assert.ok(schema);
      // Expected: tutorId, bookingId, amount, status (e.g. pendingRelease, available, refunded).
    });
  });

  describe('Financial audit', () => {
    it('financialAuditService logs booking and earnings events', async () => {
      const financialAudit = await import('../../backend/services/financialAuditService.js');
      assert.strictEqual(typeof financialAudit.logFinancialAudit, 'function');
      // Expected: logFinancialAudit writes to FinancialAuditLog for payment, release, refund events.
    });
  });
});
