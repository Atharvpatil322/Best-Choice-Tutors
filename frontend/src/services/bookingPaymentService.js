import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Create a Stripe Checkout Session for a booking and get redirect URL
 * Calls backend: POST /api/bookings/:id/pay
 *
 * @param {string} bookingId
 * @returns {Promise<Object>} { checkoutUrl, booking, message }
 */
export const createBookingPaymentOrder = async (bookingId) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create payment session');
  }

  return data;
};

