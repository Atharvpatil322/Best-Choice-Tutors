/**
 * Dispute eligibility (Phase 10)
 * Frontend check: show Raise Dispute only when booking is COMPLETED and within 24h window.
 */

const DISPUTE_WINDOW_HOURS = 24;

/**
 * Check if a COMPLETED booking is within the dispute window.
 * Session end = date + endTime. Window = 24 hours after session end.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} endTime - HH:mm
 * @returns {boolean} true if within 24h of session end
 */
export function isWithinDisputeWindow(date, endTime) {
  if (!date || !endTime) return false;

  const sessionEnd = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(sessionEnd.getTime())) return false;

  const deadline = new Date(sessionEnd.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);
  const now = new Date();
  return now.getTime() <= deadline.getTime();
}

/**
 * Check if learner can raise a dispute for this booking.
 * Requires: COMPLETED status, within 24h window, no existing dispute.
 *
 * @param {Object} booking - Must have status, date, endTime, hasDispute
 * @returns {boolean}
 */
export function canRaiseDispute(booking) {
  if (!booking) return false;
  if (booking.status !== 'COMPLETED') return false;
  if (booking.hasDispute === true) return false;
  return isWithinDisputeWindow(booking.date, booking.endTime);
}
