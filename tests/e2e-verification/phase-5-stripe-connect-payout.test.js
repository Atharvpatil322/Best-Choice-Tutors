/**
 * E2E verification: Phase 5 – Stripe Connect and payout
 *
 * High-level checks for tutor Connect onboarding, account link, account.updated webhook, and payouts.
 * Uses real stripeConnectService, stripeService, Tutor model; no mocks of business logic.
 * Run from repo root: node --test tests/e2e-verification/phase-5-stripe-connect-payout.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..', '..', 'backend');

describe('Phase 5: Stripe Connect and payout', () => {
  describe('Stripe Connect service', () => {
    it('exposes getOrCreateStripeAccountForTutor', async () => {
      const connectService = await import('../../backend/services/stripeConnectService.js');
      assert.strictEqual(typeof connectService.getOrCreateStripeAccountForTutor, 'function');
      // Expected: idempotent; creates Express account if missing, stores stripeAccountId on Tutor.
    });

    it('exposes createPayoutOnboardingLink', async () => {
      const connectService = await import('../../backend/services/stripeConnectService.js');
      assert.strictEqual(typeof connectService.createPayoutOnboardingLink, 'function');
      // Expected: returns onboardingUrl for Stripe-hosted onboarding (returnUrl, refreshUrl).
    });

    it('exposes updateTutorFromStripeAccount for account.updated webhook', async () => {
      const connectService = await import('../../backend/services/stripeConnectService.js');
      assert.strictEqual(typeof connectService.updateTutorFromStripeAccount, 'function');
      // Expected: updates Tutor stripeOnboardingStatus from account.charges_enabled, payouts_enabled, details_submitted.
    });
  });

  describe('Stripe service Connect and transfer', () => {
    it('exposes createConnectedAccount and createAccountLink', async () => {
      const stripeService = await import('../../backend/services/stripeService.js');
      assert.strictEqual(typeof stripeService.createConnectedAccount, 'function');
      assert.strictEqual(typeof stripeService.createAccountLink, 'function');
      // Expected: createConnectedAccount creates Express account; createAccountLink returns URL for onboarding.
    });

    it('exposes createTransfer for payouts to connected account', async () => {
      const stripeService = await import('../../backend/services/stripeService.js');
      assert.strictEqual(typeof stripeService.createTransfer, 'function');
      // Expected: createTransfer(amount, currency, destinationStripeAccountId, ...) for tutor payout.
    });
  });

  describe('Tutor model Stripe fields', () => {
    it('Tutor model has stripeAccountId and stripeOnboardingStatus', async () => {
      const Tutor = (await import('../../backend/models/Tutor.js')).default;
      assert.ok(Tutor);
      const paths = Tutor.schema?.paths ?? {};
      assert.ok(paths.stripeAccountId, 'Tutor should have stripeAccountId');
      assert.ok(paths.stripeOnboardingStatus, 'Tutor should have stripeOnboardingStatus');
      // Expected: stripeAccountId (Stripe account id), stripeOnboardingStatus (e.g. PENDING, COMPLETED).
    });
  });

  describe('Tutor profile routes wire onboarding', () => {
    it('tutor profile routes reference createPayoutSetupLink for Connect onboarding', () => {
      const routesContent = readFileSync(join(backendRoot, 'routes', 'tutorProfileRoutes.js'), 'utf8');
      assert.ok(routesContent.includes('createPayoutSetupLink'), 'Routes should wire createPayoutSetupLink');
      // Expected: tutorProfileRoutes.js uses createPayoutSetupLink from tutorController for payout onboarding.
    });
  });
});
