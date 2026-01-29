/**
 * Tutor Booking Detail
 * Read-only: learner name & email, session date & time, booking status.
 * "Open Chat" button. No editing, no payment logic.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTutorBooking } from '@/services/tutorBookingsService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';

function TutorBookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getTutorBooking(bookingId);
        setBooking(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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

  const displayStatus = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return 'Paid';
    if (s === 'FAILED') return 'Failed';
    if (s === 'CANCELLED') return 'Cancelled';
    return 'Pending';
  };

  const sessionStatus = booking
    ? getSessionStatus(booking.date, booking.startTime, booking.endTime)
    : null;
  const sessionLabel = sessionStatus ? getSessionStatusLabel(sessionStatus) : '—';
  const canJoin = sessionStatus === 'upcoming' || sessionStatus === 'ongoing';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading booking…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-destructive">{error || 'Booking not found.'}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={() => navigate('/tutor/bookings')}>
                  Back to Bookings
                </Button>
                <Button variant="outline" onClick={() => navigate('/tutor/dashboard')}>
                  Dashboard
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
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <Button variant="outline" onClick={() => navigate('/tutor/bookings')}>
            Back to Bookings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="mt-0.5">{booking.learnerName || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="mt-0.5">{booking.learnerEmail || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="mt-0.5">{formatDate(booking.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="mt-0.5">{formatTime(booking.startTime, booking.endTime)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Session</p>
              <span
                className={`inline-block rounded px-2 py-1 text-sm font-medium ${
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
            <p className="text-sm text-muted-foreground">
              Payment: {displayStatus(booking.status)}
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          {canJoin && (
            <Button disabled title="Video integration coming soon">
              Join Session
            </Button>
          )}
          <Button onClick={() => navigate(`/bookings/${booking.id}/chat`)}>
            Open Chat
          </Button>
          <Button variant="outline" onClick={() => navigate('/tutor/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TutorBookingDetail;
