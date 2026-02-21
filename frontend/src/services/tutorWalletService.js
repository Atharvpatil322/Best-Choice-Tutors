/**
 * Tutor Wallet Service
 * Wallet summary (pending, available, total earnings and entries).
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's wallet (totals + ledger entries)
 * @returns {Promise<{ totalEarnings: number, pendingEarnings: number, availableEarnings: number, entries: Array }>}
 */
export const getWallet = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/wallet`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch wallet');
  }

  return data;
};
