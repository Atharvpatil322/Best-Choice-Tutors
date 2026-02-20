/**
 * Google OAuth Integration
 * Handles Google Sign-In button logic and OAuth flow initiation
 * Uses Google OAuth Client ID from environment variables
 */

import { googleLogin } from '../services/authService.js';

/**
 * Google OAuth Client ID from environment
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Check if Google OAuth is configured
 * @returns {boolean}
 */
export const isGoogleAuthConfigured = () => {
  return !!GOOGLE_CLIENT_ID;
};

/**
 * Initiate Google OAuth login flow
 * Redirects to backend Google OAuth endpoint
 */
export const initiateGoogleLogin = () => {
  if (!isGoogleAuthConfigured()) {
    console.warn('Google OAuth Client ID is not configured');
    // TODO: CLARIFICATION REQUIRED - Should we show an error to user or just log?
  }
  
  // Redirect to backend Google OAuth endpoint
  // Backend handles the OAuth flow and redirects back to /auth/callback?token=...
  googleLogin();
};

/**
 * Handle Google OAuth callback
 * Called when user returns from Google OAuth flow
 * Token should be in URL query params: /auth/callback?token=...
 * @param {string} token - JWT token from backend
 */
export const handleGoogleCallback = (token) => {
  if (!token) {
    console.error('No token received from Google OAuth callback');
    return false;
  }

  // Token is already stored by backend redirect
  // The backend redirects to /auth/callback?token=... 
  // We need to extract it and store it
  // TODO: CLARIFICATION REQUIRED - Should we store token here or let authService handle it?
  
  return true;
};
