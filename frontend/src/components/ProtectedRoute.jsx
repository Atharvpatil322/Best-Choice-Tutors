/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 * Used for routes that require authentication (e.g., booking)
 */

import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth.js';

function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
