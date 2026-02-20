/**
 * Tutor Bookings Page
 * Read-only list: learner name, date, time, session (Upcoming/Ongoing/Completed), backend status.
 * Styling aligned with Tutor dashboard (profile-page-content, #1A365D, rounded-2xl cards).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { getTutorBookings } from '@/services/tutorBookingsService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';
import '../../styles/Profile.css';

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
      <div className="profile-page-content">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading bookings…</p>
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
    <div className="profile-page-content min-w-0 overflow-x-hidden">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A365D] flex items-center gap-2 truncate">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            My Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">View your scheduled sessions with learners</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/tutor')} className="rounded-lg shrink-0">
          Dashboard
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-[#1A365D]">Bookings</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              You have no bookings yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 min-w-0">
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
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-4 px-3 rounded-xl transition-colors hover:bg-slate-50 first:pt-3 last:pb-3 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1A365D] truncate">{b.learnerName || 'Learner'}</p>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">
                        {formatDate(b.date)} · {formatTime(b.startTime, b.endTime)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${getBookingStatusBadgeClass(b.status)}`}
                        >
                          {getBookingStatusLabel(b.status)}
                        </span>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
                            sessionLabel === 'Upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : sessionLabel === 'Ongoing'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sessionLabel}
                        </span>
                        {b.hasDispute && b.disputeStatus === 'OPEN' && !b.tutorEvidenceSubmitted && (
                          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 shrink-0">
                            Dispute — submit evidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canJoin && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="rounded-lg"
                          title="Video integration coming soon"
                        >
                          Join Session
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
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
                        className="rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tutor/bookings/${b.id}/chat`);
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
  );
}

export default TutorBookings;
