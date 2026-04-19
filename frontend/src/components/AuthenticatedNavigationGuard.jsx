/**
 * When logged in, blocks SPA navigations (including browser back) to public auth
 * routes (landing, login, register, etc.). Prevents history corruption from
 * redirecting those URLs while authenticated.
 */

import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { isAuthenticated } from '@/services/authService';

const PUBLIC_AUTH_PATHS = new Set(['/', '/login', '/register', '/forgot-password', '/index.html']);

function isPublicAuthPath(pathname) {
  if (PUBLIC_AUTH_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/reset-password/')) return true;
  return false;
}

function AuthenticatedNavigationGuard() {
  const blocker = useBlocker(({ nextLocation }) =>
    isAuthenticated() && isPublicAuthPath(nextLocation.pathname)
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return null;
}

export default AuthenticatedNavigationGuard;
