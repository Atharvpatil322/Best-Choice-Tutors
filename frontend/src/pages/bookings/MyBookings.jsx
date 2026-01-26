/**
 * My Bookings Page
 * FR-4.1.3, UC-4.3: Learner Views Booking History
 * 
 * TODO: PHASE 5 DEPENDENCY - Booking & Scheduling
 * This is a placeholder implementation. Full booking functionality will be implemented in Phase 5.
 * 
 * Phase 5 will include:
 * - Display of past and upcoming bookings
 * - Booking details (Tutor name, Subject, Date/Time, Status, Amount Paid)
 * - Filtering by status (Upcoming, Completed, Cancelled)
 * - Sorting by date (upcoming first, then past)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLearnerBookings } from '@/services/learnerBookingsService';
import { logout } from '@/services/authService';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getLearnerBookings();
        setBookings(data.bookings || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
        // If unauthorized, redirect to login
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBrowseTutors = () => {
    // Navigate to landing page where users can browse tutors
    // TODO: PHASE 4 - Update to dedicated tutor browse/search page when implemented
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading bookings...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-red-600">Error: {error}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToDashboard}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Bookings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>View your past and upcoming tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              /* Empty State - AF-4.3.1 */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">You haven't booked any sessions yet</h3>
                <p className="mb-6 text-muted-foreground">
                  Start your learning journey by finding the perfect tutor for you.
                </p>
                <Button onClick={handleBrowseTutors} size="lg">
                  Browse Tutors
                </Button>
              </div>
            ) : (
              /* TODO: PHASE 5 - Display bookings list when implemented */
              <div className="py-6 text-center text-muted-foreground">
                <p>Booking display will be implemented in Phase 5</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MyBookings;
