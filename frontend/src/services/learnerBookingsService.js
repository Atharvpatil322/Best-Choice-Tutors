/**
 * Learner Bookings Service
 * API layer for learner bookings operations
 * FR-4.1.3, UC-4.3: Learner Views Booking History
 * 
 * TODO: PHASE 5 DEPENDENCY - Full booking functionality will be implemented in Phase 5
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated learner's bookings
 * FR-4.1.3, UC-4.3: Returns booking history (past and upcoming)
 * @returns {Promise<Object>} { bookings: [] }
 */
export const getLearnerBookings = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/learner/bookings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch bookings');
  }

  return data;
};
