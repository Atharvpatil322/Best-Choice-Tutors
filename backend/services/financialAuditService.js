import FinancialAuditLog, {
  FINANCIAL_AUDIT_ACTIONS,
  FINANCIAL_AUDIT_PERFORMED_BY,
} from '../models/FinancialAuditLog.js';

/**
 * Log a financial state change. Append-only; never modify or delete.
 * Do NOT call for read-only views.
 *
 * @param {Object} params
 * @param {string} params.action - One of FINANCIAL_AUDIT_ACTIONS
 * @param {import('mongoose').Types.ObjectId} [params.tutorId]
 * @param {import('mongoose').Types.ObjectId} [params.bookingId]
 * @param {number} params.amountInPaise
 * @param {string} params.performedBy - 'SYSTEM' | 'ADMIN'
 * @param {import('mongoose').Types.ObjectId} [params.performedById] - Required when performedBy === 'ADMIN'
 * @param {Object} [params.metadata]
 */
export async function logFinancialAudit({
  action,
  tutorId,
  bookingId,
  amountInPaise,
  performedBy,
  performedById,
  metadata,
}) {
  if (!FINANCIAL_AUDIT_ACTIONS.includes(action)) {
    throw new Error(`Invalid financial audit action: ${action}`);
  }
  if (!FINANCIAL_AUDIT_PERFORMED_BY.includes(performedBy)) {
    throw new Error(`Invalid performedBy: ${performedBy}`);
  }
  if (performedBy === 'ADMIN' && !performedById) {
    throw new Error('performedById is required when performedBy is ADMIN');
  }

  await FinancialAuditLog.create({
    action,
    tutorId: tutorId ?? null,
    bookingId: bookingId ?? null,
    amountInPaise,
    performedBy,
    performedById: performedById ?? null,
    timestamp: new Date(),
    metadata: metadata ?? null,
  });
}

export { FINANCIAL_AUDIT_ACTIONS, FINANCIAL_AUDIT_PERFORMED_BY };
