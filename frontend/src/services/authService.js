/**
 * Authentication Service
 * API layer for authentication operations
 * Handles all communication with backend auth endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// JWT token storage key
const TOKEN_KEY = 'auth_token';
// Minimal persisted user info (for role-based UI gating)
const USER_KEY = 'auth_user';

/**
 * Store JWT token in localStorage (exported for OAuth callback)
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Store user info in localStorage (safe fields only; exported for OAuth callback)
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Get stored user info from localStorage
 */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove JWT token from localStorage
 */
const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Decode JWT token to get user info
 * Returns null if token is invalid or expired
 */
const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT is base64 encoded, split by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, profilePhoto (optional File) }
 * @returns {Promise<Object>} { token, user }
 */
export const register = async (userData) => {
  const formData = new FormData();
  formData.append('name', userData.name);
  formData.append('email', userData.email);
  formData.append('password', userData.password);
  formData.append('role', userData.role || 'learner');

  if (userData.profilePhoto) {
    formData.append('profilePhoto', userData.profilePhoto);
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  // Store token
  if (data.token) {
    setToken(data.token);
  }
  // Store minimal user info for role-based UI
  if (data.user) {
    setUser(data.user);
  }

  return data;
};

/**
 * Login with email and password
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { token, user }
 */
export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Store token
  if (data.token) {
    setToken(data.token);
  }
  // Store minimal user info for role-based UI
  if (data.user) {
    setUser(data.user);
  }

  return data;
};

const INTENDED_ROLE_KEY = 'auth_intended_role';

/**
 * Initiate Google OAuth login
 * @param {string} [intendedRole] - If 'tutor', user will be assigned Tutor after Google sign-up (for "Sign up as Tutor" flow)
 */
export const googleLogin = (intendedRole) => {
  if (intendedRole === 'tutor' || intendedRole === 'Tutor') {
    try {
      localStorage.setItem(INTENDED_ROLE_KEY, 'tutor');
    } catch (_) {}
  }
  const googleAuthUrl = `${API_BASE_URL}/auth/google`;
  window.location.href = googleAuthUrl;
};

/**
 * Get and clear intended role from storage (used after OAuth callback).
 * @returns {'tutor' | null}
 */
export const consumeIntendedRole = () => {
  try {
    const role = localStorage.getItem(INTENDED_ROLE_KEY);
    localStorage.removeItem(INTENDED_ROLE_KEY);
    return role === 'tutor' ? 'tutor' : null;
  } catch {
    return null;
  }
};

/**
 * Fetch current user from API (used after OAuth callback to get role).
 * @returns {Promise<{ user }>}
 */
export const getMe = async () => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch user');
  return data;
};

/**
 * Switch current user role from Learner to Tutor.
 * @returns {Promise<{ token, user }>}
 */
export const switchToTutor = async () => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const response = await fetch(`${API_BASE_URL}/auth/switch-to-tutor`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to switch to tutor');
  if (data.token) setToken(data.token);
  if (data.user) setUser(data.user);
  return data;
};

/**
 * Request password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} { message }
 */
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send reset email');
  }

  return data;
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} password - New password
 * @returns {Promise<Object>} { message }
 */
export const resetPassword = async (token, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Password reset failed');
  }

  return data;
};

/**
 * Get current authenticated user from token
 * Decodes JWT token if it exists
 * @returns {Object|null} Decoded token payload or null
 */
export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  
  // Check if token is expired
  if (decoded && decoded.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      // Token expired, remove it
      removeToken();
      return null;
    }
  }
  
  return decoded;
};

/**
 * Logout user
 * Removes token from localStorage
 * Dispatches custom event for socket disconnection
 */
export const logout = () => {
  removeToken();
  // Dispatch custom event for socket context to handle disconnection
  window.dispatchEvent(new Event('auth:logout'));
};

/**
 * Convenience helper for UI: current role from stored user info.
 * Falls back to null if not available.
 */
export const getCurrentRole = () => {
  const user = getStoredUser();
  return user?.role || null;
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return user !== null;
};

/**
 * Get stored token (for API requests)
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return getToken();
};
