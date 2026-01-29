/**
 * Protected Route Component
 * Redirects unauthenticated users to landing page
 * All routes except "/" require authentication
 */

import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth.js';

function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to landing page if not authenticated
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
