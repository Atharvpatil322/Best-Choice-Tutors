/**
 * Reset Password Page Component
 * Placeholder for Phase 2 - UI implementation pending
 */

import { useParams } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <p className="text-gray-600">Reset password page - UI implementation pending</p>
        <p className="text-sm text-gray-500 mt-2">Token: {token}</p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
