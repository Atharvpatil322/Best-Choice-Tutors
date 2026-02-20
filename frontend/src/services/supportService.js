import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get support tickets for current user (learner/tutor).
 * GET /api/support/tickets
 */
export const getSupportTickets = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/support/tickets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load support tickets');
  }

  return data;
};

/**
 * Create a new support ticket.
 * POST /api/support/tickets
 * Body: { subject, message }
 */
export const createSupportTicket = async ({ subject, message }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/support/tickets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, message }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create support ticket');
  }

  return data;
};

/**
 * Get a single support ticket by id.
 * GET /api/support/tickets/:ticketId
 */
export const getSupportTicketById = async (ticketId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load support ticket');
  }

  return data;
};

/**
 * Append a new message to an existing support ticket.
 * POST /api/support/tickets/:ticketId/messages
 * Body: { message }
 */
export const replyToSupportTicket = async (ticketId, { message }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send reply');
  }

  return data;
};

/**
 * Delete a support ticket created by the current user.
 * DELETE /api/support/tickets/:ticketId
 */
export const deleteSupportTicket = async (ticketId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete support ticket');
  }

  return data;
};


