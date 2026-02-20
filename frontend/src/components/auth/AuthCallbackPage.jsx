/**
 * Auth Callback Page Component
 * Handles OAuth callback from Google authentication.
 * If user had chosen "Sign up as Tutor" (intended role in localStorage), assigns Tutor after Google sign-up.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  setToken,
  setUser,
  getMe,
  switchToTutor,
  consumeIntendedRole,
} from '@/services/authService';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setToken(token);

    const run = async () => {
      try {
        const { user } = await getMe();
        setUser(user);

        const intendedRole = consumeIntendedRole();
        let finalUser = user;
        if (intendedRole === 'tutor' && user?.role === 'Learner') {
          const data = await switchToTutor();
          finalUser = data.user;
        }

        const role = finalUser?.role;
        const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;
        if (normalizedRole === 'tutor') {
          navigate('/tutor', { replace: true });
        } else if (normalizedRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        navigate('/dashboard', { replace: true });
      }
    };

    run();
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
