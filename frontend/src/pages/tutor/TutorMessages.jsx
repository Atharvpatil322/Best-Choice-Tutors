/**
 * Tutor Messages
 * Lists bookings that have chat (PAID or COMPLETED). Click to open booking chat.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { getTutorBookings } from '@/services/tutorBookingsService';
import '../../styles/Profile.css';

const CHAT_ELIGIBLE_STATUSES = ['PAID', 'COMPLETED'];

function TutorMessages() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getTutorBookings();
        const all = data.bookings || [];
        const chatEligible = all.filter((b) => CHAT_ELIGIBLE_STATUSES.includes(b.status));
        // Latest chat first: sort by lastMessageAt desc, then by session date/time desc for no-message bookings
        const sorted = [...chatEligible].sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          if (aTime !== bTime) return bTime - aTime;
          const aSession = `${a.date || ''}T${a.startTime || ''}`;
          const bSession = `${b.date || ''}T${b.startTime || ''}`;
          return bSession.localeCompare(aSession);
        });
        setBookings(sorted);
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
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">{error}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/tutor')} className="rounded-lg">
                Back to Dashboard
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
            <MessageSquare className="h-7 w-7" />
            Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Open a conversation with a learner for a paid or completed booking
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/tutor/bookings')}
          className="rounded-lg"
        >
          Bookings
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A365D]">Your conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground py-6">
              No chat yet. When a learner pays for a session, you can chat here or from the
              <strong> Bookings</strong> page for that booking.
            </p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A365D]">{b.learnerName ?? 'Learner'}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium text-slate-500">Session:</span>{' '}
                      {formatDate(b.date)} · {formatTime(b.startTime, b.endTime)}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/tutor/bookings/${b.id}/chat`)}
                    className="bg-[#1A365D] hover:bg-[#1A365D]/90 rounded-lg shrink-0"
                  >
                    Open chat
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TutorMessages;
