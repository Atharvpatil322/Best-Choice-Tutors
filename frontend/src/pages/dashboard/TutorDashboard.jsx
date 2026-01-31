/**
 * Tutor Dashboard Placeholder
 * Phase 3.5: Simple placeholder page for tutors
 * Phase 4: Added navigation to Manage Availability
 * 
 * Accessible after tutor profile creation
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { logout } from '@/services/authService';

function TutorDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tutor Dashboard</h1>
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
              <p className="text-muted-foreground">
                Tutor dashboard coming soon.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
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
                onClick={() => navigate('/tutor/profile')}
                className="w-full"
                variant="outline"
              >
                My Profile
              </Button>
              <Button
                onClick={() => navigate('/tutor/bookings')}
                className="w-full"
                variant="outline"
              >
                My Bookings
              </Button>
              <Button
                onClick={() => navigate('/tutor/wallet')}
                className="w-full"
                variant="outline"
              >
                Wallet
              </Button>
              <Button
                onClick={() => navigate('/tutor/availability')}
                className="w-full"
              >
                Manage Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;
