/**
 * My Bookings Page (Learner)
 * Read-only dashboard: tutor name, date & time, backend status.
 * Review form for completed bookings when canReview === true (star rating + text, submit; no edit/delete).
 * Phase 10: Raise dispute for COMPLETED bookings within 24h window.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getLearnerBookings } from '@/services/learnerBookingsService';
import { submitReview } from '@/services/reviewService';
import { raiseDispute, submitLearnerEvidence } from '@/services/disputeService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';
import { canRaiseDispute } from '@/utils/disputeEligibility';

const MAX_REVIEW_TEXT_LENGTH = 2000;
const MAX_DISPUTE_REASON_LENGTH = 2000;
const MAX_EVIDENCE_LENGTH = 2000;

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedReviewIds, setSubmittedReviewIds] = useState([]);
  const [reviewForm, setReviewForm] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewErrorByBookingId, setReviewErrorByBookingId] = useState({});
  const [disputedBookingIds, setDisputedBookingIds] = useState([]);
  const [disputeForm, setDisputeForm] = useState({});
  const [submittingDisputeId, setSubmittingDisputeId] = useState(null);
  const [disputeErrorByBookingId, setDisputeErrorByBookingId] = useState({});
  const [showDisputeFormByBookingId, setShowDisputeFormByBookingId] = useState({});
  const [learnerEvidenceForm, setLearnerEvidenceForm] = useState({});
  const [learnerEvidenceSubmittedIds, setLearnerEvidenceSubmittedIds] = useState([]);
  const [submittingLearnerEvidenceId, setSubmittingLearnerEvidenceId] = useState(null);
  const [learnerEvidenceErrorByBookingId, setLearnerEvidenceErrorByBookingId] = useState({});

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

  const getFormForBooking = (bookingId) => {
    return reviewForm[bookingId] ?? { rating: 0, reviewText: '' };
  };

  const setRatingForBooking = (bookingId, rating) => {
    setReviewForm((prev) => ({
      ...prev,
      [bookingId]: { ...(prev[bookingId] ?? { rating: 0, reviewText: '' }), rating },
    }));
    setReviewErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const setReviewTextForBooking = (bookingId, reviewText) => {
    setReviewForm((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] ?? { rating: 0, reviewText: '' }),
        reviewText: reviewText.slice(0, MAX_REVIEW_TEXT_LENGTH),
      },
    }));
    setReviewErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const handleSubmitReview = async (bookingId) => {
    const { rating, reviewText } = getFormForBooking(bookingId);
    if (!rating || rating < 1) return;
    setSubmittingReviewId(bookingId);
    setReviewErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
    try {
      await submitReview(bookingId, { rating, reviewText });
      setSubmittedReviewIds((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]));
    } catch (err) {
      setReviewErrorByBookingId((prev) => ({ ...prev, [bookingId]: err.message || 'Failed to submit review' }));
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const getDisputeReasonForBooking = (bookingId) => disputeForm[bookingId] ?? '';
  const setDisputeReasonForBooking = (bookingId, reason) => {
    setDisputeForm((prev) => ({
      ...prev,
      [bookingId]: (reason || '').slice(0, MAX_DISPUTE_REASON_LENGTH),
    }));
    setDisputeErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const handleRaiseDispute = async (bookingId) => {
    const reason = getDisputeReasonForBooking(bookingId);
    setSubmittingDisputeId(bookingId);
    setDisputeErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
    try {
      await raiseDispute(bookingId, reason);
      setDisputedBookingIds((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]));
      setShowDisputeFormByBookingId((prev) => ({ ...prev, [bookingId]: false }));
    } catch (err) {
      setDisputeErrorByBookingId((prev) => ({ ...prev, [bookingId]: err.message || 'Failed to raise dispute' }));
    } finally {
      setSubmittingDisputeId(null);
    }
  };

  const getLearnerEvidenceForBooking = (bookingId) => learnerEvidenceForm[bookingId] ?? '';
  const setLearnerEvidenceForBooking = (bookingId, text) => {
    setLearnerEvidenceForm((prev) => ({
      ...prev,
      [bookingId]: (text || '').slice(0, MAX_EVIDENCE_LENGTH),
    }));
    setLearnerEvidenceErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const handleSubmitLearnerEvidence = async (bookingId) => {
    const evidence = getLearnerEvidenceForBooking(bookingId);
    setSubmittingLearnerEvidenceId(bookingId);
    setLearnerEvidenceErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
    try {
      await submitLearnerEvidence(bookingId, evidence);
      setLearnerEvidenceSubmittedIds((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]));
    } catch (err) {
      setLearnerEvidenceErrorByBookingId((prev) => ({
        ...prev,
        [bookingId]: err.message || 'Failed to submit evidence',
      }));
    } finally {
      setSubmittingLearnerEvidenceId(null);
    }
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
                {bookings.map((b) => {
                  const sessionStatus = getSessionStatus(b.date, b.startTime, b.endTime);
                  const canJoin = sessionStatus === 'upcoming' || sessionStatus === 'ongoing';
                  const canReview = b.canReview === true;
                  const reviewSubmitted = submittedReviewIds.includes(b.id);
                  const form = getFormForBooking(b.id);
                  const isSubmitting = submittingReviewId === b.id;
                  const reviewError = reviewErrorByBookingId[b.id];
                  const canDispute = canRaiseDispute(b);
                  const hasDispute = b.hasDispute === true || disputedBookingIds.includes(b.id);
                  const showDisputeForm = showDisputeFormByBookingId[b.id] === true;
                  const disputeReason = getDisputeReasonForBooking(b.id);
                  const isSubmittingDispute = submittingDisputeId === b.id;
                  const disputeError = disputeErrorByBookingId[b.id];
                  const canSubmitLearnerEvidence =
                    hasDispute &&
                    b.disputeStatus === 'OPEN' &&
                    !(b.learnerEvidenceSubmitted || learnerEvidenceSubmittedIds.includes(b.id));
                  const learnerEvidence = getLearnerEvidenceForBooking(b.id);
                  const isSubmittingLearnerEvidence = submittingLearnerEvidenceId === b.id;
                  const learnerEvidenceError = learnerEvidenceErrorByBookingId[b.id];

                  return (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-nowrap"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.tutorName || 'Tutor'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(b.date)} · {formatTime(b.startTime, b.endTime)}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            sessionStatus === 'upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : sessionStatus === 'ongoing'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getSessionStatusLabel(sessionStatus)}
                        </span>
                        {canReview && (
                          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                            {reviewSubmitted ? (
                              <p className="text-sm font-medium text-muted-foreground">
                                Thank you! Your review has been submitted.
                              </p>
                            ) : (
                              <>
                                <Label className="text-xs text-muted-foreground">Rate this session (required)</Label>
                                <div className="mt-1 flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => setRatingForBooking(b.id, value)}
                                      disabled={isSubmitting}
                                      className="rounded p-0.5 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                    >
                                      <Star
                                        className={`h-6 w-6 ${
                                          form.rating >= value
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-2">
                                  <Label htmlFor={`review-text-${b.id}`} className="text-xs text-muted-foreground">
                                    Your feedback (optional)
                                  </Label>
                                  <textarea
                                    id={`review-text-${b.id}`}
                                    value={form.reviewText}
                                    onChange={(e) => setReviewTextForBooking(b.id, e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder="How was your session?"
                                    maxLength={MAX_REVIEW_TEXT_LENGTH}
                                    rows={2}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {form.reviewText.length}/{MAX_REVIEW_TEXT_LENGTH}
                                  </p>
                                </div>
                                {reviewError && (
                                  <p className="mt-1 text-sm text-destructive">{reviewError}</p>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  className="mt-2"
                                  disabled={form.rating < 1 || isSubmitting}
                                  onClick={() => handleSubmitReview(b.id)}
                                >
                                  {isSubmitting ? 'Submitting…' : 'Submit review'}
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        {canDispute && !hasDispute && (
                          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/50 p-3">
                            {showDisputeForm ? (
                              <>
                                <Label
                                  htmlFor={`dispute-reason-${b.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Reason for dispute (required)
                                </Label>
                                <textarea
                                  id={`dispute-reason-${b.id}`}
                                  value={disputeReason}
                                  onChange={(e) => setDisputeReasonForBooking(b.id, e.target.value)}
                                  disabled={isSubmittingDispute}
                                  placeholder="Describe the issue (e.g. tutor no-show, poor session quality…)"
                                  maxLength={MAX_DISPUTE_REASON_LENGTH}
                                  rows={3}
                                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {disputeReason.length}/{MAX_DISPUTE_REASON_LENGTH}
                                </p>
                                {disputeError && (
                                  <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {disputeError}
                                  </p>
                                )}
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={!disputeReason.trim() || isSubmittingDispute}
                                    onClick={() => handleRaiseDispute(b.id)}
                                  >
                                    {isSubmittingDispute ? 'Submitting…' : 'Submit dispute'}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={isSubmittingDispute}
                                    onClick={() => {
                                      setShowDisputeFormByBookingId((prev) => ({ ...prev, [b.id]: false }));
                                      setDisputeErrorByBookingId((prev) => ({ ...prev, [b.id]: undefined }));
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                                onClick={() => setShowDisputeFormByBookingId((prev) => ({ ...prev, [b.id]: true }))}
                              >
                                <AlertCircle className="mr-1.5 h-4 w-4" />
                                Raise dispute
                              </Button>
                            )}
                          </div>
                        )}
                        {hasDispute && (
                          <>
                            <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              Dispute raised — under review
                            </p>
                            {canSubmitLearnerEvidence && (
                              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/30 p-3">
                                <Label
                                  htmlFor={`learner-evidence-${b.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Submit your evidence (required for dispute review)
                                </Label>
                                <textarea
                                  id={`learner-evidence-${b.id}`}
                                  value={learnerEvidence}
                                  onChange={(e) => setLearnerEvidenceForBooking(b.id, e.target.value)}
                                  disabled={isSubmittingLearnerEvidence}
                                  placeholder="Provide details to support your dispute…"
                                  maxLength={MAX_EVIDENCE_LENGTH}
                                  rows={3}
                                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {learnerEvidence.length}/{MAX_EVIDENCE_LENGTH}
                                </p>
                                {learnerEvidenceError && (
                                  <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {learnerEvidenceError}
                                  </p>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                                  disabled={!learnerEvidence.trim() || isSubmittingLearnerEvidence}
                                  onClick={() => handleSubmitLearnerEvidence(b.id)}
                                >
                                  {isSubmittingLearnerEvidence ? 'Submitting…' : 'Submit evidence'}
                                </Button>
                              </div>
                            )}
                            {hasDispute && (b.learnerEvidenceSubmitted || learnerEvidenceSubmittedIds.includes(b.id)) && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Your evidence has been submitted.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                          onClick={() => navigate(`/bookings/${b.id}/chat`)}
                        >
                          Chat
                        </Button>
                        <span
                          className={`rounded px-2 py-0.5 text-sm font-medium ${getBookingStatusBadgeClass(b.status)}`}
                        >
                          {getBookingStatusLabel(b.status)}
                        </span>
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

export default MyBookings;
