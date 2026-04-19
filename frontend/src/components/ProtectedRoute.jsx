/**
 * Protected Route Component
 * Redirects unauthenticated users to landing page
 * All routes except "/" require authentication
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth.js';
import { getMe, getStoredUser, logout, setUser } from '@/services/authService';

function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();
  const [hydrating, setHydrating] = useState(authenticated && !getStoredUser());

  if (!authenticated) {
    // Redirect to landing page if not authenticated
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      if (!authenticated) return;
      if (getStoredUser()) {
        if (active) setHydrating(false);
        return;
      }

      try {
        const { user } = await getMe();
        if (!active) return;
        setUser(user);
      } catch {
        if (!active) return;
        // If token is stale/invalid or API call fails, clear auth and return to public route.
        logout();
      } finally {
        if (active) setHydrating(false);
      }
    };

    hydrateUser();
    return () => {
      active = false;
    };
  }, [authenticated]);

  if (hydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your account...</p>
      </div>
    );
  }

  if (!getStoredUser()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
