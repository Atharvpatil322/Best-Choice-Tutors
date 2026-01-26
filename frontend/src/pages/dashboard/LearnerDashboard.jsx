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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is a placeholder dashboard for authenticated learners.
                Full dashboard functionality will be implemented in future phases.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/tutors')}
                className="w-full"
              >
                Browse Tutors
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="w-full"
              >
                My Profile
              </Button>
              <Button
                onClick={() => navigate('/tutor/create')}
                variant="default"
                className="w-full"
              >
                Become a Tutor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LearnerDashboard;
