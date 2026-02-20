/**
 * Notifications API (shared for learners and tutors).
 * Uses GET /api/user/notifications — no socket.
 */

import { getAuthToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get notifications for the authenticated user.
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 */
export const getNotifications = async () => {
  const token = getAuthToken();
  if (!token) return { notifications: [], unreadCount: 0 };
  const response = await fetch(`${API_BASE_URL}/user/notifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return {
    notifications: data.notifications || [],
    unreadCount: data.unreadCount ?? 0,
  };
};

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = async () => {
  const token = getAuthToken();
  if (!token) return;
  await fetch(`${API_BASE_URL}/user/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
