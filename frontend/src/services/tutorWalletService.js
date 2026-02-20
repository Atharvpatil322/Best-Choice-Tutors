/**
 * Tutor Wallet Service
 * Wallet summary and withdrawal request creation (request only; no immediate deduction).
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get authenticated tutor's wallet (totals + ledger entries + hasBankDetails, canWithdraw, pendingWithdrawal)
 * @returns {Promise<{ totalEarnings: number, pendingEarnings: number, availableEarnings: number, hasBankDetails: boolean, canWithdraw: boolean, minWithdrawalAmount: number, pendingWithdrawal: object|null, entries: Array }>}
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

/**
 * Create a withdrawal request (status PENDING). Does not deduct from balance.
 * Validates: bank details, no existing PENDING, amount >= min, amount <= available.
 * @param {number} amountRequestedInPaise - Amount in paise
 * @returns {Promise<{ withdrawalRequest: object }>}
 */
export const createWithdrawalRequest = async (amountRequestedInPaise) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tutor/withdrawal-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amountRequestedInPaise }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit withdrawal request');
  }

  return data;
};

/**
 * Get tutor's bank details (masked). 404 if none.
 * GET /api/tutor/bank-details
 */
export const getBankDetails = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/tutor/bank-details`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(data.message || 'Failed to fetch bank details');
  return data;
};

/**
 * Create or update bank details. PUT /api/tutor/bank-details
 * @param {Object} payload - accountHolderName, bankName, accountNumber, country, sortCode (UK), ifscCode (India)
 */
export const updateBankDetails = async (payload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/tutor/bank-details`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to save bank details');
  return data;
};

/**
 * List tutor's withdrawal requests. GET /api/tutor/withdrawal-requests
 */
export const getMyWithdrawalRequests = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/tutor/withdrawal-requests`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch withdrawal requests');
  return data;
};
