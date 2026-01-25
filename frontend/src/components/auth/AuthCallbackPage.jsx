/**
 * Auth Callback Page Component
 * Handles OAuth callback from Google authentication
 * Extracts token from URL and stores it
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Store token in localStorage (matching authService token key)
      localStorage.setItem('auth_token', token);
      
      // Redirect to Learner Dashboard after successful auth
      navigate('/dashboard', { replace: true });
    } else {
      // No token received, redirect to login
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
