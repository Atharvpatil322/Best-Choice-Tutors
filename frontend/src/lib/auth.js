/**
 * Simple Auth State Management
 * Minimal auth state handling for Phase 2
 * Detects authenticated user via JWT presence
 */

import { 
  getCurrentUser as getCurrentUserFromService, 
  isAuthenticated as checkAuth 
} from '../services/authService.js';

/**
 * Get current authenticated user
 * @returns {Object|null} User data from decoded JWT or null
 */
export const getCurrentUser = () => {
  return getCurrentUserFromService();
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return checkAuth();
};

/**
 * Get user ID from token if authenticated
 * @returns {string|null}
 */
export const getUserId = () => {
  const user = getCurrentUserFromService();
  return user?.userId || null;
};
