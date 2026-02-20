import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import DisputeAuditLog from '../models/DisputeAuditLog.js';
import TutorEarnings from '../models/TutorEarnings.js';
import {
  releaseWalletForBookingInternal,
  markTutorEarningsRefunded,
  releasePartialToTutor,
} from './bookingService.js';
import { createRefund } from './razorpayService.js';
import { logFinancialAudit } from './financialAuditService.js';

/** Dispute window: learners may raise a dispute within this many hours after session end */
const DISPUTE_WINDOW_HOURS = 24;

/** Valid audit actions */
const AUDIT_ACTIONS = {
  DISPUTE_CREATED: 'DISPUTE_CREATED',
  LEARNER_EVIDENCE_SUBMITTED: 'LEARNER_EVIDENCE_SUBMITTED',
  TUTOR_EVIDENCE_SUBMITTED: 'TUTOR_EVIDENCE_SUBMITTED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
};

/**
 * Append an immutable audit log entry. Never update or delete.
 */
async function logDisputeAudit({ actorId, actorRole, disputeId, action }) {
  await DisputeAuditLog.create({
    actorId,
    actorRole,
    disputeId,
    action,
    timestamp: new Date(),
  });
}

/**
 * Domain error for dispute-related validation failures
 */
export class DisputeError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DisputeError';
    this.statusCode = statusCode;
  }
}

/**
 * Get the session end time for a booking.
 * Session end = booking.date + booking.endTime (local time).
 *
 * @param {Object} booking - Must have date (YYYY-MM-DD) and endTime (HH:mm)
 * @returns {Date} Session end time
 */
function getSessionEndTime(booking) {
  const { date, endTime } = booking;
  const sessionEnd = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(sessionEnd.getTime())) {
    return new Date(0);
  }
  return sessionEnd;
}

/**
 * Validate that a learner can initiate a dispute for a booking.
 * Throws DisputeError if any rule fails.
 *
 * Rules:
 * - Only learner of the booking can initiate
 * - Booking must be COMPLETED
 * - Dispute must be raised within 24 hours of session completion time
 *
 * @param {Object} params
 * @param {Object} params.booking - Booking document (plain or lean)
 * @param {string} params.learnerId - ID of user attempting to initiate (must match booking.learnerId)
 * @throws {DisputeError}
 */
export function validateDisputeEligibility({ booking, learnerId }) {
  if (!booking) {
    throw new DisputeError('Booking not found', 404);
  }

  if (booking.learnerId.toString() !== learnerId.toString()) {
    throw new DisputeError('Only the learner of this booking can initiate a dispute', 403);
  }

  if (booking.status !== 'COMPLETED') {
    throw new DisputeError('Disputes can only be raised for completed bookings', 400);
  }

  const sessionEnd = getSessionEndTime(booking);
  const disputeDeadline = new Date(sessionEnd.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);
  const now = new Date();

  if (now.getTime() > disputeDeadline.getTime()) {
    throw new DisputeError(
      `Dispute window has expired. Disputes must be raised within ${DISPUTE_WINDOW_HOURS} hours of session completion`,
      400
    );
  }
}

/**
 * Initiate a dispute for a booking.
 * Validates eligibility, ensures no existing dispute, then creates the dispute.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.learnerId - Learner user ID
 * @param {string} [params.reason] - Optional dispute reason (stored as learnerEvidence)
 * @returns {Promise<Dispute>}
 */
export async function initiateDispute({ bookingId, learnerId, reason }) {
  const booking = await Booking.findById(bookingId).lean();
  validateDisputeEligibility({ booking, learnerId });

  const existingDispute = await Dispute.findOne({ bookingId });
  if (existingDispute) {
    throw new DisputeError('A dispute already exists for this booking', 400);
  }

  const dispute = await Dispute.create({
    bookingId,
    learnerId,
    tutorId: booking.tutorId,
    status: 'OPEN',
    learnerEvidence: reason?.trim() || null,
  });

  await logDisputeAudit({
    actorId: learnerId,
    actorRole: 'Learner',
    disputeId: dispute._id,
    action: AUDIT_ACTIONS.DISPUTE_CREATED,
  });

  return dispute;
}

/**
 * Submit learner evidence for an OPEN dispute.
 * Only the learner of the dispute can submit. Evidence only editable while status is OPEN.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID (dispute is 1:1 with booking)
 * @param {string} params.learnerId - Learner user ID (must match dispute.learnerId)
 * @param {string} params.learnerEvidence - Evidence text
 * @returns {Promise<Dispute>}
 */
export async function submitLearnerEvidence({ bookingId, learnerId, learnerEvidence }) {
  const dispute = await Dispute.findOne({ bookingId }).lean();
  if (!dispute) {
    throw new DisputeError('Dispute not found', 404);
  }
  if (dispute.status !== 'OPEN') {
    throw new DisputeError('Evidence can only be submitted while the dispute is OPEN', 400);
  }
  if (dispute.learnerId.toString() !== learnerId.toString()) {
    throw new DisputeError('Only the learner of this dispute can submit learner evidence', 403);
  }

  const updated = await Dispute.findByIdAndUpdate(
    dispute._id,
    { $set: { learnerEvidence: learnerEvidence?.trim() ?? null } },
    { new: true }
  );

  await logDisputeAudit({
    actorId: learnerId,
    actorRole: 'Learner',
    disputeId: dispute._id,
    action: AUDIT_ACTIONS.LEARNER_EVIDENCE_SUBMITTED,
  });

  return updated;
}

/**
 * Submit tutor evidence for an OPEN dispute.
 * Only the tutor of the dispute can submit. Evidence only editable while status is OPEN.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID (dispute is 1:1 with booking)
 * @param {string} params.tutorId - Tutor document ID (must match dispute.tutorId)
 * @param {string} params.tutorEvidence - Evidence text
 * @param {string} params.actorId - User ID of the tutor (for audit log)
 * @returns {Promise<Dispute>}
 */
export async function submitTutorEvidence({ bookingId, tutorId, tutorEvidence, actorId }) {
  const dispute = await Dispute.findOne({ bookingId }).lean();
  if (!dispute) {
    throw new DisputeError('Dispute not found', 404);
  }
  if (dispute.status !== 'OPEN') {
    throw new DisputeError('Evidence can only be submitted while the dispute is OPEN', 400);
  }
  if (dispute.tutorId.toString() !== tutorId.toString()) {
    throw new DisputeError('Only the tutor of this dispute can submit tutor evidence', 403);
  }
  if (!actorId) {
    throw new DisputeError('Actor ID is required for audit logging', 500);
  }

  const updated = await Dispute.findByIdAndUpdate(
    dispute._id,
    { $set: { tutorEvidence: tutorEvidence?.trim() ?? null } },
    { new: true }
  );

  await logDisputeAudit({
    actorId,
    actorRole: 'Tutor',
    disputeId: dispute._id,
    action: AUDIT_ACTIONS.TUTOR_EVIDENCE_SUBMITTED,
  });

  return updated;
}

/** Valid dispute resolution outcomes */
export const DISPUTE_OUTCOMES = ['FULL_REFUND', 'PARTIAL_REFUND', 'RELEASE_PAYMENT_TO_TUTOR'];

/**
 * Resolve a dispute (admin only). Decision is final.
 *
 * On resolution:
 * - Update Dispute status to RESOLVED, set resolvedAt, outcome, refundAmountInPaise
 * - FULL_REFUND: Razorpay refund full amount; mark TutorEarnings as refunded
 * - PARTIAL_REFUND: Razorpay refund specified amount; release remainder to tutor
 * - RELEASE_PAYMENT_TO_TUTOR: Release TutorEarnings to available
 *
 * @param {Object} params
 * @param {string} params.disputeId - Dispute ID
 * @param {string} params.outcome - FULL_REFUND | PARTIAL_REFUND | RELEASE_PAYMENT_TO_TUTOR
 * @param {number} [params.refundAmountInPaise] - Required for PARTIAL_REFUND
 * @param {string} params.adminId - User ID of the admin (for audit log)
 * @returns {Promise<Dispute>}
 */
export async function resolveDispute({ disputeId, outcome, refundAmountInPaise, adminId }) {
  if (!DISPUTE_OUTCOMES.includes(outcome)) {
    throw new DisputeError(`Invalid outcome. Must be one of: ${DISPUTE_OUTCOMES.join(', ')}`, 400);
  }
  if (!adminId) {
    throw new DisputeError('Admin ID is required for audit logging', 500);
  }

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new DisputeError('Dispute not found', 404);
  }
  if (dispute.status !== 'OPEN') {
    throw new DisputeError('Dispute is already resolved', 400);
  }

  const booking = await Booking.findById(dispute.bookingId).lean();
  if (!booking) {
    throw new DisputeError('Booking not found', 404);
  }

  const walletEntry = await TutorEarnings.findOne({ bookingId: dispute.bookingId }).lean();
  if (!walletEntry) {
    throw new DisputeError('Tutor earnings entry not found for this booking', 404);
  }

  const originalAmountInPaise = walletEntry.amount;
  const resolvedAt = new Date();

  if (outcome === 'FULL_REFUND') {
    const paymentId = booking.razorpayPaymentId;
    if (!paymentId) {
      throw new DisputeError('Payment ID not available for refund. Booking may predate this feature.', 400);
    }
    await createRefund({ paymentId });
    await markTutorEarningsRefunded(dispute.bookingId);
    await logFinancialAudit({
      action: 'REFUND_FULL',
      tutorId: walletEntry.tutorId,
      bookingId: dispute.bookingId,
      amountInPaise: originalAmountInPaise,
      performedBy: 'ADMIN',
      performedById: adminId,
    });
  } else if (outcome === 'PARTIAL_REFUND') {
    if (refundAmountInPaise == null || !Number.isInteger(refundAmountInPaise) || refundAmountInPaise <= 0) {
      throw new DisputeError('refundAmountInPaise is required for PARTIAL_REFUND and must be a positive integer', 400);
    }
    if (refundAmountInPaise >= originalAmountInPaise) {
      throw new DisputeError('Partial refund amount must be less than the original payment amount', 400);
    }
    const paymentId = booking.razorpayPaymentId;
    if (!paymentId) {
      throw new DisputeError('Payment ID not available for refund. Booking may predate this feature.', 400);
    }
    await createRefund({ paymentId, amount: refundAmountInPaise });
    await logFinancialAudit({
      action: 'REFUND_PARTIAL',
      tutorId: walletEntry.tutorId,
      bookingId: dispute.bookingId,
      amountInPaise: refundAmountInPaise,
      performedBy: 'ADMIN',
      performedById: adminId,
    });
    const netAmountInPaise = originalAmountInPaise - refundAmountInPaise;
    await releasePartialToTutor(dispute.bookingId, netAmountInPaise, {
      performedBy: 'ADMIN',
      performedById: adminId,
    });
  } else {
    // RELEASE_PAYMENT_TO_TUTOR — use internal release (dispute resolved, no check needed)
    await releaseWalletForBookingInternal(dispute.bookingId, {
      performedBy: 'ADMIN',
      performedById: adminId,
    });
    await Booking.updateOne({ _id: dispute.bookingId }, { status: 'COMPLETED' });
  }

  dispute.status = 'RESOLVED';
  dispute.resolvedAt = resolvedAt;
  dispute.outcome = outcome;
  dispute.refundAmountInPaise = outcome === 'PARTIAL_REFUND' ? refundAmountInPaise : null;
  await dispute.save();

  await logDisputeAudit({
    actorId: adminId,
    actorRole: 'Admin',
    disputeId: dispute._id,
    action: AUDIT_ACTIONS.DISPUTE_RESOLVED,
  });

  return dispute;
}
