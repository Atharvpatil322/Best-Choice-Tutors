/**
 * My Bookings Page (Learner)
 * Read-only dashboard: tutor name, date & time, status (Pending / Paid / Failed).
 * No cancellation or payment actions.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLearnerBookings } from '@/services/learnerBookingsService';

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

  const statusLabel = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return 'Paid';
    if (s === 'FAILED') return 'Failed';
    return 'Pending';
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
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
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
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
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
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{b.tutorName || 'Tutor'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(b.date)} · {formatTime(b.startTime, b.endTime)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-sm font-medium ${
                        (b.status || '').toUpperCase() === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : (b.status || '').toUpperCase() === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MyBookings;
