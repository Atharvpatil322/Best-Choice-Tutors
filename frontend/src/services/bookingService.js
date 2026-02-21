import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Create a booking for a slot
 * Calls backend: POST /api/bookings
 *
 * @param {Object} params
 * @param {string} params.tutorId - Tutor ID
 * @param {string} params.date - YYYY-MM-DD
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @param {string} [params.requestId] - Optional tuition request ID for request-based negotiated pricing
 * @returns {Promise<Object>} { message, booking: { id, agreedHourlyRate, ... } }
 */
export const createBooking = async ({ tutorId, date, startTime, endTime, requestId }) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const body = { tutorId, date, startTime, endTime };
  if (requestId) body.requestId = requestId;

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create booking');
  }

  return data;
};

/**
 * DEV TESTING ONLY – REMOVE BEFORE PRODUCTION
 * PATCH /api/bookings/:id/test-payment-status
 * Backend only accepts in NODE_ENV !== 'production'. Use to unblock testing when Stripe webhook is not updating booking.
 * @param {string} bookingId - Booking ID
 * @param {'PAID' | 'FAILED'} status
 * @returns {Promise<Object>}
 */
export const updateTestPaymentStatus = async (bookingId, status) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/test-payment-status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update test payment status');
  return data;
};

/**
 * Reschedule a booking to a new date/time slot
 * Calls backend: PATCH /api/bookings/:bookingId/reschedule
 *
 * @param {string} bookingId - Booking ID
 * @param {string} date - New date YYYY-MM-DD
 * @param {string} startTime - New start time HH:mm
 * @param {string} endTime - New end time HH:mm
 * @returns {Promise<Object>} { message, booking: { id, date, startTime, endTime, ... } }
 */
export const rescheduleBooking = async (bookingId, { date, startTime, endTime }) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, startTime, endTime }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to reschedule booking');
  }

  return data;
};
