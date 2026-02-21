/**
 * Stripe Connect onboarding for tutors.
 * One Stripe Express account per tutor (idempotent). No manual bank collection; Stripe hosts onboarding.
 */

import Tutor from '../models/Tutor.js';
import { createConnectedAccount, createAccountLink } from './stripeService.js';

/**
 * Get or create Stripe Connect Express account for a tutor. Idempotent: one account per tutor.
 * @param {Object} tutor - Tutor document (plain or Mongoose) with _id, optional stripeAccountId
 * @param {string} [email] - User email for Stripe account
 * @returns {Promise<{ accountId: string }>}
 */
export async function getOrCreateStripeAccountForTutor(tutor, email) {
  const tutorId = tutor._id;
  const existing = tutor.stripeAccountId;
  if (existing && typeof existing === 'string' && existing.trim()) {
    return { accountId: existing.trim() };
  }

  const account = await createConnectedAccount({
    email: email && String(email).trim() ? String(email).trim() : undefined,
    country: 'GB',
    metadata: { tutorId: tutorId.toString() },
  });

  const accountId = account.id;
  if (!accountId) {
    throw new Error('Stripe did not return an account ID.');
  }

  await Tutor.updateOne(
    { _id: tutorId },
    {
      $set: {
        stripeAccountId: accountId,
        stripeOnboardingStatus: 'PENDING',
        lastOnboardingError: null,
        updatedAt: new Date(),
      },
    }
  );

  return { accountId };
}

/**
 * Create an Account Link for the tutor and return the redirect URL. Creates account if needed.
 * @param {Object} tutor - Tutor document
 * @param {string} [email] - User email
 * @param {string} returnUrl - URL to redirect after onboarding (e.g. frontend profile page)
 * @param {string} refreshUrl - URL if link expires (e.g. same as returnUrl)
 * @returns {Promise<{ onboardingUrl: string }>}
 */
export async function createPayoutOnboardingLink(tutor, email, returnUrl, refreshUrl) {
  const { accountId } = await getOrCreateStripeAccountForTutor(tutor, email);
  const link = await createAccountLink({
    accountId,
    returnUrl,
    refreshUrl: refreshUrl || returnUrl,
  });
  if (!link.url) {
    throw new Error('Stripe did not return an onboarding URL.');
  }
  return { onboardingUrl: link.url };
}

/**
 * Update Tutor from Stripe account.updated webhook. Called with event.data.object.
 * @param {Object} account - Stripe Account object (id, charges_enabled, payouts_enabled, details_submitted)
 * @returns {Promise<import('../models/Tutor.js')|null>} Updated tutor or null if not found
 */
export async function updateTutorFromStripeAccount(account) {
  const accountId = account?.id;
  if (!accountId) return null;

  const tutor = await Tutor.findOne({ stripeAccountId: accountId });
  if (!tutor) return null;

  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  let stripeOnboardingStatus = 'NOT_STARTED';
  if (chargesEnabled && payoutsEnabled) {
    stripeOnboardingStatus = 'COMPLETED';
  } else if (detailsSubmitted) {
    stripeOnboardingStatus = 'PENDING';
  }

  const update = {
    chargesEnabled,
    payoutsEnabled,
    stripeOnboardingStatus,
    updatedAt: new Date(),
  };
  if (stripeOnboardingStatus === 'COMPLETED') {
    update.lastOnboardingError = null;
  }

  await Tutor.updateOne({ _id: tutor._id }, { $set: update });
  return Tutor.findById(tutor._id);
}
