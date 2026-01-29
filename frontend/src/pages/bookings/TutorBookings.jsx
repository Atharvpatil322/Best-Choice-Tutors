/**
 * Tutor Bookings Page
 * Read-only list under tutor dashboard: learner name, date, time, status (Upcoming / Paid / Completed).
 * Each booking is clickable (navigate to chat). No cancel or reschedule.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTutorBookings } from '@/services/tutorBookingsService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';

function TutorBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getTutorBookings();
        setBookings(data.bookings || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (start, end) => {
    if (!start || !end) return '—';
    const fmt = (t) => {
      const [h, m] = (t || '').split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m || '00'} ${ampm}`;
    };
    return `${fmt(start)} – ${fmt(end)}`;
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
              <p className="text-center text-destructive">{error}</p>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
            Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                You have no bookings yet.
              </p>
            ) : (
              <ul className="divide-y">
                {bookings.map((b) => {
                  const sessionStatus = getSessionStatus(b.date, b.startTime, b.endTime);
                  const canJoin = sessionStatus === 'upcoming' || sessionStatus === 'ongoing';
                  const sessionLabel = getSessionStatusLabel(sessionStatus);
                  return (
                    <li
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/tutor/bookings/${b.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/tutor/bookings/${b.id}`);
                        }
                      }}
                      className="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:bg-muted/50 first:pt-0 last:pb-0 sm:flex-nowrap rounded-md px-2 -mx-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.learnerName || 'Learner'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(b.date)} · {formatTime(b.startTime, b.endTime)}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            sessionLabel === 'Upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : sessionLabel === 'Ongoing'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sessionLabel}
                        </span>
                      </div>
                      <div
                        className="flex shrink-0 flex-wrap items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canJoin && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled
                            title="Video integration coming soon"
                          >
                            Join Session
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tutor/bookings/${b.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${b.id}/chat`);
                          }}
                        >
                          Chat
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TutorBookings;
