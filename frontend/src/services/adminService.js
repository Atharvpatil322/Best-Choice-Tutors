/**
 * Admin Service
 * Admin-only APIs for dashboards, moderation, and support.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get admin dashboard summary (admin only)
 * GET /api/admin/summary
 * @returns {Promise<{ totalUsers, totalTutors, totalLearners, totalBookings, totalRevenue, totalEscrowAmount }>}
 */
export const getSummary = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch summary');
  }

  return data;
};

/**
 * Get financial overview (admin only)
 * GET /api/admin/financials
 * @returns {Promise<{ totalPayments, totalEscrow, totalPaidOut, totalRefunded, activeDisputesCount }>}
 */
export const getFinancials = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/financials`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch financials');
  return data;
};

/**
 * Get list of all conversations (admin only, read-only)
 * GET /api/admin/conversations
 * @returns {Promise<{ conversations: Array, count: number }>}
 */
export const getConversations = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/conversations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch conversations');
  return data;
};

/**
 * Get chat messages for a booking (admin only, read-only)
 * GET /api/admin/bookings/:bookingId/messages
 * @param {string} bookingId
 * @returns {Promise<{ bookingId, count: number, messages: Array }>}
 */
export const getBookingMessages = async (bookingId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/bookings/${encodeURIComponent(bookingId)}/messages`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch messages');
  return data;
};

/**
 * Get admin audit log (admin only, read-only)
 * GET /api/admin/audit-log?limit=200
 * @param {{ limit?: number }} [params]
 * @returns {Promise<{ count: number, entries: Array }>}
 */
export const getAuditLog = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/admin/audit-log${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch audit log');
  return data;
};

/**
 * Get platform config (admin only)
 * GET /api/admin/config
 * @returns {Promise<{ commissionRate, updatedAt }>}
 */
export const getConfig = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/config`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch config');
  return data;
};

/**
 * Update platform config (admin only)
 * PATCH /api/admin/config
 * @param {{ commissionRate?: number }} body
 * @returns {Promise<{ message, config }>}
 */
export const updateConfig = async (body) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/config`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update config');
  return data;
};

/**
 * Get users list (admin only)
 * GET /api/admin/users?role=Learner|Tutor
 * @param {{ role?: 'Learner' | 'Tutor' }} [params]
 * @returns {Promise<{ count: number, users: Array }>}
 */
export const getUsers = async (params = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const search = new URLSearchParams();
  if (params.role) search.set('role', params.role);
  const query = search.toString() ? `?${search.toString()}` : '';

  const response = await fetch(`${API_BASE_URL}/admin/users${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return data;
};

/**
 * Suspend user (admin only)
 * PATCH /api/admin/users/:userId/suspend
 */
export const suspendUser = async (userId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to suspend user');
  return data;
};

/**
 * Ban user (admin only)
 * PATCH /api/admin/users/:userId/ban
 */
export const banUser = async (userId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to ban user');
  return data;
};

/**
 * Activate user (admin only)
 * PATCH /api/admin/users/:userId/activate
 */
export const activateUser = async (userId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to activate user');
  return data;
};

/**
 * Get pending (unverified) tutors (admin only)
 * GET /api/admin/tutors/pending
 * @returns {Promise<{ count: number, tutors: Array }>}
 */
export const getPendingTutors = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/tutors/pending`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch pending tutors');
  return data;
};

/**
 * Get all tutors with verification documents (admin only). Includes approved/rejected so admin can view documents later.
 * GET /api/admin/tutors/verification
 * @returns {Promise<{ count: number, tutors: Array<{ id, fullName, email, isVerified, verificationRejectedAt, ... }> }>}
 */
export const getTutorVerificationTutors = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/tutors/verification`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch tutors');
  return data;
};

/**
 * Get tutor verification documents (admin only, read-only)
 * GET /api/admin/tutors/:tutorId/documents
 * @param {string} tutorId
 * @returns {Promise<{ tutorId: string, count: number, documents: Array }>}
 */
export const getTutorDocuments = async (tutorId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/tutors/${encodeURIComponent(tutorId)}/documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch tutor documents');
  return data;
};

/**
 * Approve tutor (admin only)
 * PATCH /api/admin/tutors/:tutorId/approve
 */
export const approveTutor = async (tutorId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/tutors/${tutorId}/approve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to approve tutor');
  return data;
};

/**
 * Reject tutor (admin only)
 * PATCH /api/admin/tutors/:tutorId/reject
 */
export const rejectTutor = async (tutorId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/tutors/${tutorId}/reject`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reject tutor');
  return data;
};

/**
 * Get reported reviews (admin only)
 * GET /api/admin/reported-reviews
 * @returns {Promise<{ count: number, reportedReviews: Array }>}
 */
export const getReportedReviews = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/reported-reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reported reviews');
  }

  return data;
};

/**
 * Get disputes list (admin only)
 * GET /api/admin/disputes
 * @returns {Promise<{ disputes: Array }>}
 */
export const getDisputes = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch disputes');
  }
  return data;
};

/**
 * Get dispute detail (admin only)
 * GET /api/admin/disputes/:disputeId
 * @param {string} disputeId
 * @returns {Promise<Object>}
 */
export const getDispute = async (disputeId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes/${disputeId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dispute');
  }
  return data;
};

/**
 * Resolve dispute (admin only)
 * PATCH /api/admin/disputes/:disputeId/resolve
 * @param {string} disputeId
 * @param {Object} body - { outcome, refundAmountInPaise? }
 * @returns {Promise<Object>}
 */
export const resolveDispute = async (disputeId, body) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/admin/disputes/${disputeId}/resolve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to resolve dispute');
  }
  return data;
};

/**
 * Get tutors with DBS submissions (admin only)
 * GET /api/admin/dbs/pending
 * @returns {Promise<{ count: number, tutors: Array }>}
 */
export const getDbsPendingTutors = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/dbs/pending`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch DBS pending tutors');
  return data;
};

/**
 * Get DBS documents for a tutor (admin only)
 * GET /api/admin/tutors/:tutorId/dbs-documents
 * @param {string} tutorId
 * @returns {Promise<{ tutorId: string, count: number, documents: Array }>}
 */
export const getTutorDbsDocuments = async (tutorId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(
    `${API_BASE_URL}/admin/tutors/${encodeURIComponent(tutorId)}/dbs-documents`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch tutor DBS documents');
  return data;
};

/**
 * Approve DBS document (admin only)
 * PATCH /api/admin/dbs/:documentId/approve
 * @param {string} documentId
 */
export const approveDbsDocument = async (documentId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(
    `${API_BASE_URL}/admin/dbs/${encodeURIComponent(documentId)}/approve`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to approve DBS document');
  return data;
};

/**
 * Reject DBS document (admin only)
 * PATCH /api/admin/dbs/:documentId/reject
 * @param {string} documentId
 */
export const rejectDbsDocument = async (documentId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(
    `${API_BASE_URL}/admin/dbs/${encodeURIComponent(documentId)}/reject`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reject DBS document');
  return data;
};

/**
 * Get support tickets queue (admin only)
 * GET /api/admin/support/tickets?status=OPEN|IN_PROGRESS|CLOSED
 * @param {{ status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' }} [params]
 * @returns {Promise<{ tickets: Array }>}
 */
export const getSupportTicketsQueue = async (params = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  const query = search.toString() ? `?${search.toString()}` : '';

  const response = await fetch(`${API_BASE_URL}/admin/support/tickets${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch support tickets');
  }
  return data;
};

/**
 * Get a single support ticket by id (admin only)
 * GET /api/admin/support/tickets/:ticketId
 * @param {string} ticketId
 */
export const getSupportTicketAdmin = async (ticketId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(ticketId)}`,
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
    throw new Error(data.message || 'Failed to fetch support ticket');
  }
  return data;
};

/**
 * Post an admin reply to a support ticket (admin only)
 * POST /api/admin/support/tickets/:ticketId/messages
 * Body: { message }
 */
export const replyToSupportTicketAdmin = async (ticketId, { message }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(ticketId)}/messages`,
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
 * Update support ticket status (admin only)
 * PATCH /api/admin/support/tickets/:ticketId/status
 * Body: { status: 'IN_PROGRESS' | 'CLOSED' }
 */
export const updateSupportTicketStatusAdmin = async (ticketId, { status }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(
    `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(ticketId)}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update support ticket status');
  }
  return data;
};

/**
 * Send a notification to all learners and tutors (admin only).
 * POST /api/admin/notifications/broadcast
 * @param {{ title: string, message: string }}
 * @returns {Promise<{ message: string, count: number }>}
 */
export const broadcastNotification = async ({ title, message }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/admin/notifications/broadcast`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, message }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send broadcast');
  return data;
};

