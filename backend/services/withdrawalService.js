import TutorEarnings from '../models/TutorEarnings.js';
import PlatformConfig from '../models/PlatformConfig.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import WithdrawalDeduction from '../models/WithdrawalDeduction.js';
import Dispute from '../models/Dispute.js';
import { getBankDetailsForTutor } from './tutorBankDetailsService.js';
import { logFinancialAudit } from './financialAuditService.js';

/**
 * Compute effective available earnings for a tutor: sum(available TutorEarnings) - sum(WithdrawalDeduction).
 * Does not modify or delete TutorEarnings rows.
 * @param {import('mongoose').Types.ObjectId} tutorId
 * @returns {Promise<number>} Amount in paise
 */
export async function getAvailableEarnings(tutorId) {
  const [earningsSum, deductionsSum] = await Promise.all([
    TutorEarnings.aggregate([
      { $match: { tutorId, status: 'available' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total ?? 0),
    WithdrawalDeduction.aggregate([
      { $match: { tutorId } },
      { $group: { _id: null, total: { $sum: '$amountInPaise' } } },
    ]).then((r) => r[0]?.total ?? 0),
  ]);

  return Math.max(0, earningsSum - deductionsSum);
}

/**
 * Get platform minimum withdrawal amount (paise) from config.
 * @returns {Promise<number>}
 */
export async function getMinWithdrawalAmount() {
  const config = await PlatformConfig.findOne().lean();
  return config?.minWithdrawalAmount ?? 0;
}

/**
 * Create a withdrawal request. All validation is server-side only.
 * Enforces: no open dispute affecting tutor, no existing PENDING, bank details,
 * amount <= available, amount >= platform min. Uses partial unique index to prevent race double-PENDING.
 * Does NOT modify TutorEarnings.
 *
 * @param {Object} params
 * @param {import('mongoose').Types.ObjectId} params.tutorId
 * @param {number} params.amountRequestedInPaise - Amount in paise
 * @returns {Promise<import('mongoose').Document>}
 * @throws {Error} When validation fails
 */
export async function createWithdrawalRequest({ tutorId, amountRequestedInPaise }) {
  const amount = Number(amountRequestedInPaise);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('Amount must be a non-negative integer (paise)');
  }

  // 1) Prevent withdrawal if tutor has an open dispute (earnings may be affected)
  const hasOpenDispute = await Dispute.exists({ tutorId, status: 'OPEN' });
  if (hasOpenDispute) {
    throw new Error(
      'You cannot request a withdrawal while a booking is under dispute. Wait for the dispute to be resolved.'
    );
  }

  // 2) Prevent if pending withdrawal exists (also enforced by unique index for race safety)
  const existingPending = await WithdrawalRequest.findOne({
    tutorId,
    status: 'PENDING',
  }).lean();
  if (existingPending) {
    throw new Error(
      'You already have a pending withdrawal request. Wait for it to be processed before submitting another.'
    );
  }

  // 3) Must have bank details
  const bankDetails = await getBankDetailsForTutor(tutorId);
  if (!bankDetails) {
    throw new Error('Bank details are required before requesting a withdrawal.');
  }

  // 4) Insufficient balance and min withdrawal: server-side from PlatformConfig
  const availableEarnings = await getAvailableEarnings(tutorId);
  const minAmount = await getMinWithdrawalAmount();

  if (amount > availableEarnings) {
    const availablePounds = (availableEarnings / 100).toFixed(2);
    throw new Error(
      `Requested amount exceeds available earnings (£${availablePounds} available).`
    );
  }

  if (minAmount > 0 && amount < minAmount) {
    const minPounds = (minAmount / 100).toFixed(2);
    throw new Error(
      `Requested amount is below the minimum withdrawal (£${minPounds}).`
    );
  }

  const bankDetailsSnapshot = {
    accountHolderName: bankDetails.accountHolderName ?? '',
    bankName: bankDetails.bankName ?? '',
    country: bankDetails.country ?? '',
    maskedAccountNumber: bankDetails.maskedAccountNumber ?? '****',
    maskedSortCodeOrIfsc: bankDetails.maskedSortCodeOrIfsc ?? '****',
  };

  let request;
  try {
    request = await WithdrawalRequest.create({
      tutorId,
      amountRequested: amount,
      status: 'PENDING',
      requestedAt: new Date(),
      bankDetailsSnapshot,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new Error(
        'You already have a pending withdrawal request. Wait for it to be processed before submitting another.'
      );
    }
    throw err;
  }

  await logFinancialAudit({
    action: 'WITHDRAWAL_REQUESTED',
    tutorId,
    withdrawalId: request._id,
    amountInPaise: request.amountRequested,
    performedBy: 'SYSTEM',
  });

  return request;
}

/**
 * Check if tutor has any PENDING withdrawal request.
 * @param {import('mongoose').Types.ObjectId} tutorId
 * @returns {Promise<boolean>}
 */
export async function hasPendingWithdrawal(tutorId) {
  const exists = await WithdrawalRequest.exists({
    tutorId,
    status: 'PENDING',
  });
  return !!exists;
}

/**
 * Approve a withdrawal request (atomic). Only one approval can succeed per request.
 * Sets status APPROVED, creates WithdrawalDeduction, logs audit. Does NOT modify TutorEarnings.
 */
export async function approveWithdrawalRequest({ withdrawalRequestId, adminId }) {
  const now = new Date();
  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: withdrawalRequestId, status: 'PENDING' },
    { $set: { status: 'APPROVED', processedAt: now, processedBy: adminId } },
    { new: true }
  );

  if (!request) {
    throw new Error('Withdrawal request not found or already processed');
  }

  await WithdrawalDeduction.create({
    tutorId: request.tutorId,
    withdrawalRequestId: request._id,
    amountInPaise: request.amountRequested,
  });

  await logFinancialAudit({
    action: 'WITHDRAWAL_APPROVED',
    tutorId: request.tutorId,
    withdrawalId: request._id,
    amountInPaise: request.amountRequested,
    performedBy: 'ADMIN',
    performedById: adminId,
  });

  return request;
}

/**
 * Reject a withdrawal request (atomic). Only one reject can succeed per request.
 */
export async function rejectWithdrawalRequest({ withdrawalRequestId, adminId }) {
  const now = new Date();
  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: withdrawalRequestId, status: 'PENDING' },
    { $set: { status: 'REJECTED', processedAt: now, processedBy: adminId } },
    { new: true }
  );

  if (!request) {
    throw new Error('Withdrawal request not found or already processed');
  }

  await logFinancialAudit({
    action: 'WITHDRAWAL_REJECTED',
    tutorId: request.tutorId,
    withdrawalId: request._id,
    amountInPaise: request.amountRequested,
    performedBy: 'ADMIN',
    performedById: adminId,
  });

  return request;
}

/**
 * Mark withdrawal as PAID after admin has transferred money (atomic). Only from APPROVED.
 */
export async function markWithdrawalPaid({ withdrawalRequestId, adminId, transactionReference }) {
  const now = new Date();
  const update = {
    status: 'PAID',
    processedAt: now,
    processedBy: adminId,
  };
  if (transactionReference != null && String(transactionReference).trim()) {
    update.transactionReference = String(transactionReference).trim();
  }

  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: withdrawalRequestId, status: 'APPROVED' },
    { $set: update },
    { new: true }
  );

  if (!request) {
    throw new Error('Withdrawal request not found or not in APPROVED status');
  }

  await logFinancialAudit({
    action: 'WITHDRAWAL_PAID',
    tutorId: request.tutorId,
    withdrawalId: request._id,
    amountInPaise: request.amountRequested,
    performedBy: 'ADMIN',
    performedById: adminId,
    metadata: transactionReference ? { transactionReference } : null,
  });

  return request;
}
