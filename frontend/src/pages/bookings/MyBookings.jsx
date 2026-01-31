/**
 * My Bookings Page (Learner)
 * Read-only dashboard: tutor name, date & time, backend status.
 * Review form for completed bookings when canReview === true (star rating + text, submit; no edit/delete).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getLearnerBookings } from '@/services/learnerBookingsService';
import { submitReview } from '@/services/reviewService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';

const MAX_REVIEW_TEXT_LENGTH = 2000;

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedReviewIds, setSubmittedReviewIds] = useState([]);
  const [reviewForm, setReviewForm] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewErrorByBookingId, setReviewErrorByBookingId] = useState({});

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
