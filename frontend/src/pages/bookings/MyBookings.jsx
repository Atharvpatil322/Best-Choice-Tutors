/**
 * My Bookings Page (Learner)
 * Read-only dashboard: tutor name, date & time, backend status.
 * Review form for completed bookings when canReview === true (star rating + text, submit; no edit/delete).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, AlertCircle, Video, MessageCircle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getLearnerBookings } from '@/services/learnerBookingsService';
import { submitReview } from '@/services/reviewService';
import { rescheduleBooking } from '@/services/bookingService';
import { getTutorSlots } from '@/services/tutorService';
import { getSessionStatus, getSessionStatusLabel } from '@/utils/sessionStatus';
import { getBookingStatusLabel, getBookingStatusBadgeClass } from '@/utils/bookingStatus';
import "../../styles/Bookings.css";
import { ProfileAvatar } from '@/components/ProfileAvatar';

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
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  // Reschedule state
  const [rescheduleModalOpenByBookingId, setRescheduleModalOpenByBookingId] = useState({});
  const [rescheduleSlotsByBookingId, setRescheduleSlotsByBookingId] = useState({});
  const [rescheduleSlotsLoadingByBookingId, setRescheduleSlotsLoadingByBookingId] = useState({});
  const [selectedRescheduleSlotByBookingId, setSelectedRescheduleSlotByBookingId] = useState({});
  const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
  const [rescheduleErrorByBookingId, setRescheduleErrorByBookingId] = useState({});
  const [rescheduleSuccessByBookingId, setRescheduleSuccessByBookingId] = useState({});
  const [confirmReschedule, setConfirmReschedule] = useState({ bookingId: null, slot: null }); // { bookingId, slot } when open
  const confirmRescheduleRef = useRef({ bookingId: null, slot: null }); // keep a ref so Continue click has values if dialog closes first

  const refetchBookings = useCallback(async (options = {}) => {
    const { silent = false } = options; // silent: don't show full-page loading (e.g. after reschedule)
    try {
      if (!silent) setLoading(true);
      const data = await getLearnerBookings();
      setBookings(data.bookings || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and refetch when navigating here (e.g. after creating a booking)
  useEffect(() => {
    refetchBookings();
  }, [refetchBookings]);

  // Refetch when returning to this tab so new bookings appear without full reload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refetchBookings();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchBookings]);

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

  // Derive session status and tab counts from actual bookings
  const bookingsWithSessionStatus = bookings.map((b) => ({
    ...b,
    sessionStatus: getSessionStatus(b.date, b.startTime, b.endTime),
  }));
  const upcomingBookings = bookingsWithSessionStatus.filter(
    (b) =>
      b.status !== 'CANCELLED' &&
      b.status !== 'FAILED' &&
      (b.sessionStatus === 'upcoming' || b.sessionStatus === 'ongoing')
  );
  const pastBookings = bookingsWithSessionStatus.filter(
    (b) =>
      b.status !== 'CANCELLED' &&
      b.status !== 'FAILED' &&
      b.sessionStatus === 'completed'
  );
  const cancelledBookings = bookingsWithSessionStatus.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'FAILED'
  );
  const filteredBookings =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
        ? pastBookings
        : cancelledBookings;

  // Reschedule handlers
  const handleOpenRescheduleModal = async (booking) => {
    const bookingId = booking.id;
    setRescheduleModalOpenByBookingId((prev) => ({ ...prev, [bookingId]: true }));
    setRescheduleErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
    setRescheduleSuccessByBookingId((prev) => ({ ...prev, [bookingId]: false }));
    setSelectedRescheduleSlotByBookingId((prev) => ({ ...prev, [bookingId]: null }));

    // Fetch tutor slots
    try {
      setRescheduleSlotsLoadingByBookingId((prev) => ({ ...prev, [bookingId]: true }));
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 28); // 4 weeks ahead

      const fromDateStr = today.toISOString().split('T')[0];
      const toDateStr = endDate.toISOString().split('T')[0];

      const slotsData = await getTutorSlots(booking.tutorId, fromDateStr, toDateStr);
      setRescheduleSlotsByBookingId((prev) => ({
        ...prev,
        [bookingId]: slotsData.slots || [],
      }));
    } catch (err) {
      setRescheduleErrorByBookingId((prev) => ({
        ...prev,
        [bookingId]: err.message || 'Failed to load available slots',
      }));
    } finally {
      setRescheduleSlotsLoadingByBookingId((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCloseRescheduleModal = (bookingId) => {
    setRescheduleModalOpenByBookingId((prev) => ({ ...prev, [bookingId]: false }));
    setSelectedRescheduleSlotByBookingId((prev) => ({ ...prev, [bookingId]: null }));
    setRescheduleErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const handleSelectRescheduleSlot = (bookingId, slot) => {
    setSelectedRescheduleSlotByBookingId((prev) => ({ ...prev, [bookingId]: slot }));
    setRescheduleErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
  };

  const handleConfirmRescheduleClick = (bookingId) => {
    const selectedSlot = selectedRescheduleSlotByBookingId[bookingId];
    if (!selectedSlot) return;
    const payload = { bookingId, slot: selectedSlot };
    confirmRescheduleRef.current = payload;
    setConfirmReschedule(payload);
  };

  const handleSubmitReschedule = async (bookingId) => {
    const selectedSlot = selectedRescheduleSlotByBookingId[bookingId] || confirmReschedule.slot;
    if (!selectedSlot) return;

    setConfirmReschedule({ bookingId: null, slot: null }); // close confirm dialog
    setReschedulingBookingId(bookingId);
    setRescheduleErrorByBookingId((prev) => ({ ...prev, [bookingId]: undefined }));
    try {
      const data = await rescheduleBooking(bookingId, {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      const updated = data?.booking;
      if (updated && updated.id) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === updated.id
              ? { ...b, date: updated.date, startTime: updated.startTime, endTime: updated.endTime }
              : b
          )
        );
      }
      setRescheduleSuccessByBookingId((prev) => ({ ...prev, [bookingId]: true }));
      setTimeout(() => {
        handleCloseRescheduleModal(bookingId);
        setRescheduleSuccessByBookingId((prev) => ({ ...prev, [bookingId]: false }));
        refetchBookings({ silent: true });
      }, 2200);
    } catch (err) {
      setRescheduleErrorByBookingId((prev) => ({
        ...prev,
        [bookingId]: err.message || 'Failed to reschedule booking',
      }));
    } finally {
      setReschedulingBookingId(null);
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
                <Button variant="outline" onClick={() => navigate('/dashboard', { replace: true })}>
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
  <div className="bookings-page-container">
    {/* Page Header */}
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-[#1A365D]">My Bookings</h1>
    </div>

    {/* Tab Navigation - counts from actual data */}
    <div className="flex gap-4 mb-6 bg-white p-2 rounded-xl border border-gray-100 w-fit">
      <button
        type="button"
        onClick={() => setActiveTab('upcoming')}
        className={`px-6 py-2 rounded-lg font-medium text-sm ${
          activeTab === 'upcoming' ? 'bg-[#E2E8F0] text-[#1A365D]' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        Upcoming {upcomingBookings.length}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('past')}
        className={`px-6 py-2 rounded-lg font-medium text-sm ${
          activeTab === 'past' ? 'bg-[#E2E8F0] text-[#1A365D]' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        Past {pastBookings.length}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('cancelled')}
        className={`px-6 py-2 rounded-lg font-medium text-sm ${
          activeTab === 'cancelled' ? 'bg-[#E2E8F0] text-[#1A365D]' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        Cancelled {cancelledBookings.length}
      </button>
    </div>

    {/* Bookings List - filtered by tab */}
    <div className="space-y-6">
      {bookings.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-dashed">
          No bookings found.
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-dashed">
          No {activeTab} bookings.
        </Card>
      ) : (
        filteredBookings.map((b) => {
                  const sessionStatus = b.sessionStatus ?? getSessionStatus(b.date, b.startTime, b.endTime);
                  const canJoin = sessionStatus === 'upcoming' || sessionStatus === 'ongoing';
                  const canReview = b.canReview === true;
                  const reviewSubmitted = submittedReviewIds.includes(b.id);
                  const form = getFormForBooking(b.id);
                  const isSubmitting = submittingReviewId === b.id;
                  const reviewError = reviewErrorByBookingId[b.id];
                  // Reschedule state for this booking
                  const canReschedule = b.status === 'PAID' && sessionStatus === 'upcoming';
                  const rescheduleModalOpen = rescheduleModalOpenByBookingId[b.id] === true;
                  const rescheduleSlots = rescheduleSlotsByBookingId[b.id] || [];
                  const rescheduleSlotsLoading = rescheduleSlotsLoadingByBookingId[b.id] === true;
                  const selectedRescheduleSlot = selectedRescheduleSlotByBookingId[b.id];
                  const isRescheduling = reschedulingBookingId === b.id;
                  const rescheduleError = rescheduleErrorByBookingId[b.id];
                  const rescheduleSuccess = rescheduleSuccessByBookingId[b.id] === true;

          return (
            <Card key={b.id} className="booking-premium-card overflow-hidden">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                
                {/* Tutor Info & Details */}
                <div className="flex gap-6 flex-1">
                  <ProfileAvatar
                    src={b.tutorProfilePhoto}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#1A365D]">{b.tutorName}</h3>
                      <span className={`px-4 py-1 rounded-full text-xs font-bold ${getBookingStatusBadgeClass(b.status)}`}>
                        {getBookingStatusLabel(b.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <CalendarClock size={14} /> {formatDate(b.date)}
                      </p>
                      <p className="flex items-center gap-2 ml-5">{formatTime(b.startTime, b.endTime)}</p>
                    </div>
                    {(b.totalAmount != null || b.agreedHourlyRate != null) && (
                      <p className="text-lg font-bold text-[#1A365D] pt-2">
                        {b.totalAmount != null
                          ? `£${Number(b.totalAmount).toFixed(2)}`
                          : `£${Number(b.agreedHourlyRate).toFixed(2)}/hr`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vertical Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {canJoin && (
                    <Button className="w-full bg-[#1A365D] text-white rounded-lg h-10 font-bold">
                      <Video size={16} className="mr-2" /> Join Session
                    </Button>
                  )}
                  <Button variant="outline" className="w-full text-[#1A365D] border-slate-200 h-10 font-bold"
                    onClick={() => navigate(`/dashboard/bookings/${b.id}/chat`)}>
                    <MessageCircle size={16} className="mr-2" /> Message Tutor
                  </Button>
                  {canReschedule && (
                    <Button
                      variant="outline"
                      className="w-full text-[#1A365D] border-slate-200 h-10 font-bold"
                      onClick={() => handleOpenRescheduleModal(b)}
                    >
                      <CalendarClock size={16} className="mr-2" /> Reschedule
                    </Button>
                  )}
                </div>
              </CardContent>

              {/* Review & Feedback Section */}
              {canReview && (
                <div className="border-t border-gray-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-[#1A365D]">Review & Feedback</h4>
                  </div>
                  
                  {reviewSubmitted ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <Star className="h-4 w-4 text-green-600 fill-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        Thank you! Your review has been submitted.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <Label className="text-sm font-medium text-[#1A365D] mb-2 block">
                          Rate this session <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setRatingForBooking(b.id, value)}
                              disabled={isSubmitting}
                              className="rounded transition-all hover:scale-110 disabled:pointer-events-none disabled:opacity-50"
                              aria-label={`${value} star${value === 1 ? '' : 's'}`}
                            >
                              <Star
                                className={`h-7 w-7 transition-colors ${
                                  form.rating >= value
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback Text */}
                      <div>
                        <Label htmlFor={`review-text-${b.id}`} className="text-sm font-medium text-[#1A365D] mb-2 block">
                          Your feedback <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <textarea
                          id={`review-text-${b.id}`}
                          value={form.reviewText}
                          onChange={(e) => setReviewTextForBooking(b.id, e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Share your experience... How was the session? What did you learn?"
                          maxLength={MAX_REVIEW_TEXT_LENGTH}
                          rows={3}
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="mt-1 flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {form.reviewText.length}/{MAX_REVIEW_TEXT_LENGTH} characters
                          </p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {reviewError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{reviewError}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-medium"
                        disabled={form.rating < 1 || isSubmitting}
                        onClick={() => handleSubmitReview(b.id)}
                      >
                        {isSubmitting ? 'Submitting…' : 'Submit Review'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Reschedule Dialog */}
              {canReschedule && (
                <AlertDialog open={rescheduleModalOpen} onOpenChange={(open) => {
                  if (!open) handleCloseRescheduleModal(b.id);
                }}>
                  <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reschedule Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Select a new time slot for your session with {b.tutorName}. 
                        You cannot reschedule within 24 hours of the original session start time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-4">
                      {/* Current Booking Info */}
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">Current Booking</p>
                        <p className="text-sm text-blue-800">
                          {formatDate(b.date)} — {formatTime(b.startTime, b.endTime)}
                        </p>
                      </div>

                      {/* Success Message */}
                      {rescheduleSuccess && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Booking rescheduled successfully!
                            </p>
                            <p className="text-xs text-green-700 mt-0.5">
                              Your updated session is shown in your bookings below.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {rescheduleError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{rescheduleError}</p>
                        </div>
                      )}

                      {/* Slots Loading */}
                      {rescheduleSlotsLoading && (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">Loading available slots...</p>
                        </div>
                      )}

                      {/* Slots List */}
                      {!rescheduleSlotsLoading && rescheduleSlots.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No available time slots at the moment.
                          </p>
                        </div>
                      )}

                      {!rescheduleSlotsLoading && rescheduleSlots.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-[#1A365D]">
                            Select a new time slot:
                          </p>

                          {/* Group slots by date */}
                          {(() => {
                            const groupedByDate = rescheduleSlots.reduce((acc, slot) => {
                              if (!acc[slot.date]) acc[slot.date] = [];
                              acc[slot.date].push(slot);
                              return acc;
                            }, {});
                            const dates = Object.keys(groupedByDate).sort();

                            return (
                              <Accordion type="single" collapsible className="w-full">
                                {dates.map((date) => {
                                  const isSelected = selectedRescheduleSlot?.date === date && 
                                    selectedRescheduleSlot?.startTime === groupedByDate[date][0]?.startTime;
                                  return (
                                    <AccordionItem key={date} value={date}>
                                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                        {formatDate(date)}
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="flex flex-wrap gap-2">
                                          {groupedByDate[date].map((slot, index) => {
                                            const isSlotSelected = selectedRescheduleSlot?.date === slot.date &&
                                              selectedRescheduleSlot?.startTime === slot.startTime &&
                                              selectedRescheduleSlot?.endTime === slot.endTime;
                                            return (
                                              <Button
                                                key={`${date}-${index}`}
                                                type="button"
                                                variant={isSlotSelected ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={isRescheduling}
                                                onClick={() => handleSelectRescheduleSlot(b.id, slot)}
                                                className={
                                                  isSlotSelected
                                                    ? 'ring-2 ring-primary ring-offset-2 bg-[#1A365D] text-white'
                                                    : ''
                                                }
                                              >
                                                {formatTime(slot.startTime, slot.endTime)}
                                              </Button>
                                            );
                                          })}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            );
                          })()}

                          {/* Selected Slot Display */}
                          {selectedRescheduleSlot && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-sm font-medium text-primary mb-1">Selected Slot</p>
                              <p className="text-sm text-[#1A365D]">
                                {formatDate(selectedRescheduleSlot.date)} — {formatTime(selectedRescheduleSlot.startTime, selectedRescheduleSlot.endTime)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isRescheduling}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleConfirmRescheduleClick(b.id)}
                        disabled={!selectedRescheduleSlot || isRescheduling}
                        className="bg-[#1A365D] hover:bg-[#1A365D]/90"
                      >
                        {isRescheduling ? 'Rescheduling…' : 'Confirm Reschedule'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

            </Card>
          );
        })
      )}
    </div>

    {/* Reschedule confirmation AlertDialog (single instance) */}
    <AlertDialog
      open={!!confirmReschedule.slot}
      onOpenChange={(open) => {
        if (!open) {
          confirmRescheduleRef.current = { bookingId: null, slot: null };
          setConfirmReschedule({ bookingId: null, slot: null });
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm reschedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reschedule this session to{' '}
            <span className="font-semibold text-foreground">
              {confirmReschedule.slot && formatDate(confirmReschedule.slot.date)} at {confirmReschedule.slot && formatTime(confirmReschedule.slot.startTime, confirmReschedule.slot.endTime)}
            </span>
            ? Your tutor will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reschedulingBookingId}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const { bookingId: bid, slot } = confirmRescheduleRef.current;
              if (bid && slot) handleSubmitReschedule(bid);
            }}
            disabled={!!reschedulingBookingId}
            className="bg-[#1A365D] hover:bg-[#1A365D]/90"
          >
            {reschedulingBookingId ? 'Rescheduling…' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}

export default MyBookings;
