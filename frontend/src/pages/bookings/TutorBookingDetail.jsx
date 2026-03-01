/**
 * Tutor Booking Detail
 * Read-only: learner, session, status. Open Chat.
 * Styling aligned with Tutor dashboard (profile-page-content, #1A365D, rounded-2xl cards).
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getTutorBooking } from '@/services/tutorBookingsService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';
import '../../styles/Profile.css';

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

  const sessionStatus = booking
    ? getSessionStatus(booking.date, booking.startTime, booking.endTime)
    : null;
  const sessionLabel = sessionStatus ? getSessionStatusLabel(sessionStatus) : '—';
  const canJoin = sessionStatus === 'upcoming' || sessionStatus === 'ongoing';

  if (loading) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading booking…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">{error || 'Booking not found.'}</p>
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => navigate('/tutor/bookings')} className="rounded-lg">
                Back to Bookings
              </Button>
              <Button variant="outline" onClick={() => navigate('/tutor')} className="rounded-lg">
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            Booking Details
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {booking.learnerName || 'Learner'} · {formatDate(booking.date)} · {formatTime(booking.startTime, booking.endTime)}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/tutor/bookings')} className="rounded-lg">
          Back to Bookings
        </Button>
      </div>

      {/* Single card: booking info in standard sections */}
      <Card className="profile-section-card mt-6">
        <div className="section-header">
          <h3>Booking information</h3>
        </div>
        <div className="section-grid">
          <div className="info-block">
            <Label className="text-slate-500">Learner name</Label>
            <p className="mt-0.5">{booking.learnerName || '—'}</p>
          </div>
          <div className="info-block">
            <Label className="text-slate-500">Email</Label>
            <p className="mt-0.5">{booking.learnerEmail || '—'}</p>
          </div>
          <div className="info-block">
            <Label className="text-slate-500">Date</Label>
            <p className="mt-0.5">{formatDate(booking.date)}</p>
          </div>
          <div className="info-block">
            <Label className="text-slate-500">Time</Label>
            <p className="mt-0.5">{formatTime(booking.startTime, booking.endTime)}</p>
          </div>
          <div className="info-block">
            <Label className="text-slate-500">Booking status</Label>
            <p className="mt-0.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getBookingStatusBadgeClass(booking.status)}`}>
                {getBookingStatusLabel(booking.status)}
              </span>
            </p>
          </div>
          <div className="info-block">
            <Label className="text-slate-500">Session</Label>
            <p className="mt-0.5">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  sessionLabel === 'Upcoming'
                    ? 'bg-blue-100 text-blue-800'
                    : sessionLabel === 'Ongoing'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sessionLabel}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        {canJoin && (
          <Button disabled className="rounded-lg" title="Video integration coming soon">
            Join Session
          </Button>
        )}
        <Button
          onClick={() => navigate(`/tutor/bookings/${booking.id}/chat`)}
          className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg"
        >
          Open Chat
        </Button>
        <Button variant="outline" onClick={() => navigate('/tutor/bookings')} className="rounded-lg">
          Back to Bookings
        </Button>
      </div>
    </div>
  );
}

export default TutorBookingDetail;
