/**
 * Learner Dashboard Placeholder
 * Phase 2: Simple placeholder page after successful authentication
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { logout } from '@/services/authService';

function LearnerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Learner Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder dashboard for authenticated learners.
              Full dashboard functionality will be implemented in future phases.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LearnerDashboard;
