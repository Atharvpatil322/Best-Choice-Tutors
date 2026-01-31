/**
 * Tutor Booking Detail
 * Read-only: learner name & email, session date & time, backend booking status (Pending/Paid/Completed/Cancelled/No show/Failed).
 * "Open Chat" button. Phase 10: Submit evidence for OPEN disputes.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getTutorBooking } from '@/services/tutorBookingsService';
import { submitTutorEvidence } from '@/services/disputeService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';

const MAX_EVIDENCE_LENGTH = 2000;

function TutorBookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutorEvidence, setTutorEvidence] = useState('');
  const [tutorEvidenceSubmitted, setTutorEvidenceSubmitted] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);

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

  const canSubmitTutorEvidence =
    booking?.hasDispute === true &&
    booking?.disputeStatus === 'OPEN' &&
    !(booking?.tutorEvidenceSubmitted || tutorEvidenceSubmitted);

  const handleSubmitTutorEvidence = async () => {
    if (!bookingId || !tutorEvidence.trim()) return;
    setSubmittingEvidence(true);
    setEvidenceError(null);
    try {
      await submitTutorEvidence(bookingId, tutorEvidence);
      setTutorEvidenceSubmitted(true);
    } catch (err) {
      setEvidenceError(err.message || 'Failed to submit evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

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
              <p className="mb-1 text-sm font-medium text-muted-foreground">Booking status</p>
              <span
                className={`inline-block rounded px-2 py-1 text-sm font-medium ${getBookingStatusBadgeClass(booking.status)}`}
              >
                {getBookingStatusLabel(booking.status)}
              </span>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Session</p>
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
          </CardContent>
        </Card>

        {canSubmitTutorEvidence && (
          <Card className="mt-4 border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Dispute — Submit Your Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A dispute has been raised for this session. Please provide your evidence below.
              </p>
              <div>
                <Label htmlFor="tutor-evidence" className="text-xs text-muted-foreground">
                  Your evidence
                </Label>
                <textarea
                  id="tutor-evidence"
                  value={tutorEvidence}
                  onChange={(e) => {
                    setTutorEvidence(e.target.value.slice(0, MAX_EVIDENCE_LENGTH));
                    setEvidenceError(null);
                  }}
                  disabled={submittingEvidence}
                  placeholder="Provide your side of the story…"
                  maxLength={MAX_EVIDENCE_LENGTH}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tutorEvidence.length}/{MAX_EVIDENCE_LENGTH}
                </p>
              </div>
              {evidenceError && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {evidenceError}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                disabled={!tutorEvidence.trim() || submittingEvidence}
                onClick={handleSubmitTutorEvidence}
              >
                {submittingEvidence ? 'Submitting…' : 'Submit evidence'}
              </Button>
            </CardContent>
          </Card>
        )}

        {(booking?.hasDispute && (booking?.tutorEvidenceSubmitted || tutorEvidenceSubmitted)) && (
          <Card className="mt-4 border-amber-200 bg-amber-50/20">
            <CardContent className="pt-6">
              <p className="flex items-center gap-2 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Your evidence has been submitted. The dispute is under admin review.
              </p>
            </CardContent>
          </Card>
        )}

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
