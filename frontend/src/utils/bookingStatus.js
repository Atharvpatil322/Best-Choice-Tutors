/**
 * Booking status from backend (booking.status).
 * Labels and badge styles for PENDING, PAID, FAILED, CANCELLED, COMPLETED, NO_SHOW.
 */

/**
 * @param {string} [status]
 * @returns {string}
 */
export function getBookingStatusLabel(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'Pending';
  if (s === 'PAID') return 'Paid';
  if (s === 'FAILED') return 'Failed';
  if (s === 'CANCELLED') return 'Cancelled';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'NO_SHOW') return 'No show';
  return 'Pending';
}

/**
 * Tailwind-style badge classes for booking status (background + text).
 * @param {string} [status]
 * @returns {string}
 */
export function getBookingStatusBadgeClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return 'bg-green-100 text-green-800';
  if (s === 'COMPLETED') return 'bg-emerald-100 text-emerald-800';
  if (s === 'FAILED') return 'bg-red-100 text-red-800';
  if (s === 'CANCELLED') return 'bg-slate-200 text-slate-800';
  if (s === 'NO_SHOW') return 'bg-amber-100 text-amber-800';
  if (s === 'PENDING') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}
