/**
 * Tutor Profile View Page (Learner)
 * UI task: Tutor Profile View for learners
 * 
 * Features:
 * - Fetches tutor details using GET /api/tutors/:id
 * - Displays: profile photo, name, bio, subjects, education, experience, hourly rate, mode, location
 * - Fetches availability from GET /api/tutors/:id/availability
 * - Fetches slots from GET /api/tutors/:id/slots
 * - Displays upcoming slots (date, startTime, endTime)
 * - Learner can select ONE available slot, create booking, then pay via Razorpay checkout (test mode).
 * - Public, read-only page
 * - No availability editing
 * - No webhook logic; success/failure handled in frontend callbacks only.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTutorById, getTutorAvailability, getTutorSlots } from '@/services/tutorService';
import { createBooking } from '@/services/bookingService.js';
import { createBookingPaymentOrder } from '@/services/bookingPaymentService.js';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay.js';

function TutorProfile({ tutorId: propTutorId }) {
  const { id: routeId } = useParams();
  const id = propTutorId || routeId;
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  /** Selected slot. Single selection. */
  const [selectedSlot, setSelectedSlot] = useState(null);
  /** Booking creation: loading and error */
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  /** Created booking id from backend (after successful create) */
  const [createdBookingId, setCreatedBookingId] = useState(null);
  /** Payment: loading (opening checkout), success, error (cancelled/failed) */
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        setLoading(true);
        const data = await getTutorById(id);
        setTutor(data.tutor);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tutor profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTutor();
    }
  }, [id]);

  useEffect(() => {
    const fetchAvailabilityAndSlots = async () => {
      // Do not call slots API if tutorId is undefined
      if (!id) return;

      try {
        setSlotsLoading(true);

        // Fetch availability (optional, for reference)
        try {
          const availabilityData = await getTutorAvailability(id);
          setAvailability(availabilityData.availability);
        } catch (err) {
          // Availability might not exist, that's okay
          console.log('Availability not found:', err.message);
        }

        // Fetch slots for the next 4 weeks
        // Backend generates, deduplicates, filters past slots, and sorts deterministically
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 28); // 4 weeks ahead

        const fromDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const toDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Ensure required query params are provided
        if (!fromDateStr || !toDateStr) {
          throw new Error('Invalid date range');
        }

        const slotsData = await getTutorSlots(id, fromDateStr, toDateStr);

        // Backend returns slots already filtered (past slots removed) and sorted
        // Frontend only renders - no generation, filtering, or sorting logic
        setSlots(slotsData.slots || []);
      } catch (err) {
        console.error('Failed to load availability/slots:', err);
        // Handle backend 400/500 responses gracefully without crashing UI
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    if (id && !loading) {
      fetchAvailabilityAndSlots();
    }
  }, [id, loading]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Placeholder for missing data
  const Placeholder = ({ text }) => (
    <span className="text-muted-foreground italic">{text || 'Not provided'}</span>
  );

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group slots by date for display so that we only render
  // date sections that actually have at least one available slot.
  const groupedSlotsByDate = slots.reduce((acc, slot) => {
    if (!slot?.date) return acc;
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const groupedDates = Object.keys(groupedSlotsByDate).sort();

  // Stable key for slot identity (for selection comparison)
  const getSlotKey = (slot) =>
    slot ? `${slot.date}-${slot.startTime}-${slot.endTime}` : '';
  const isSlotSelected = (slot) =>
    selectedSlot !== null && getSlotKey(selectedSlot) === getSlotKey(slot);
  // Backend returns only available slots; if it later adds slot.available we disable when false
  const isSlotUnavailable = (slot) => slot?.available === false;

  const handleSlotClick = (slot) => {
    if (isSlotUnavailable(slot)) return;
    setSelectedSlot((prev) =>
      prev && getSlotKey(prev) === getSlotKey(slot) ? null : slot
    );
    setBookingError(null);
    setCreatedBookingId(null);
    setPaymentSuccess(false);
    setPaymentError(null);
  };

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

  const handleBookSession = async () => {
    if (!selectedSlot || !id) return;
    setBookingLoading(true);
    setBookingError(null);
    setPaymentSuccess(false);
    setPaymentError(null);
    try {
      const data = await createBooking({
        tutorId: id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      const bookingId = data.booking?.id ?? null;
      setCreatedBookingId(bookingId);

      if (!bookingId) return;

      if (!razorpayKeyId) {
        setPaymentError('Razorpay key not configured');
        return;
      }
      await openPaymentCheckout(bookingId);
    } catch (err) {
      setBookingError(err.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const openPaymentCheckout = async (bookingIdToPay) => {
    if (!bookingIdToPay || !razorpayKeyId) return;
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      const payData = await createBookingPaymentOrder(bookingIdToPay);
      const order = payData.order;
      if (!order?.id) {
        setPaymentError('Payment order missing');
        return;
      }
      await loadRazorpayScript();
      openRazorpayCheckout({
        key: razorpayKeyId,
        order,
        onSuccess() {
          setPaymentSuccess(true);
          setPaymentError(null);
        },
        onDismiss() {
          setPaymentError('Payment cancelled or failed');
        },
      });
    } catch (payErr) {
      setPaymentError(payErr.message || 'Failed to open payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRetryPayment = () => {
    if (!createdBookingId) return;
    openPaymentCheckout(createdBookingId);
  };

  const handleBookAnother = () => {
    setSelectedSlot(null);
    setCreatedBookingId(null);
    setPaymentSuccess(false);
    setPaymentError(null);
    setBookingError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading tutor profile...</p>
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
              <p className="text-center text-red-600">Error: {error}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Tutor not found</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleBack}>
                  Go Back
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tutor Profile</h1>
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        </div>

        {/* Tutor Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tutor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo and Name */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex-shrink-0">
                {tutor.profilePhoto ? (
                  <img
                    src={tutor.profilePhoto}
                    alt={tutor.fullName}
                    className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                    <svg
                      className="h-16 w-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-semibold">
                  {tutor.fullName || <Placeholder text="Name not provided" />}
                </h2>
                <p className="text-muted-foreground">
                  {tutor.mode || <Placeholder />}
                </p>
              </div>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{tutor.bio}</p>
              </div>
            )}

            {/* Professional Details */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Professional Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Education</label>
                  <p className="mt-1">
                    {tutor.education || <Placeholder />}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Years of Experience
                  </label>
                  <p className="mt-1">
                    {tutor.experienceYears !== undefined && tutor.experienceYears !== null ? (
                      `${tutor.experienceYears} ${tutor.experienceYears === 1 ? 'year' : 'years'}`
                    ) : (
                      <Placeholder />
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                  <p className="mt-1">
                    {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null ? (
                      `£${parseFloat(tutor.hourlyRate).toFixed(2)}/hour`
                    ) : (
                      <Placeholder />
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teaching Mode</label>
                  <p className="mt-1">
                    {tutor.mode || <Placeholder />}
                  </p>
                </div>
                {tutor.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="mt-1">
                      {tutor.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subjects */}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking confirmation (payment success) */}
        {paymentSuccess && selectedSlot && tutor && (
          <Card className="mt-6 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800">Booking confirmed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your session with {tutor.fullName || 'the tutor'} is confirmed.
              </p>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tutor</dt>
                  <dd className="font-medium">{tutor.fullName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium">{formatDate(selectedSlot.date)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="font-medium">
                    {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                  </dd>
                </div>
                {createdBookingId && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Booking ID</dt>
                    <dd className="font-mono text-xs">{createdBookingId}</dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="default">
                  <Link to="/bookings">View my bookings</Link>
                </Button>
                <Button variant="outline" onClick={handleBookAnother}>
                  Book another session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment failed / pending (retry option) */}
        {paymentError && createdBookingId && !paymentSuccess && (
          <Card className="mt-6 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Payment not completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {paymentError}. Your booking is still pending. Complete payment to confirm your session.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleRetryPayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Opening payment…' : 'Retry payment'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/bookings">View my bookings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability & Slots */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <p className="text-center text-muted-foreground py-4">
                Loading available slots...
              </p>
            ) : slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No available time slots at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Showing upcoming available time slots for the next 4 weeks
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Select one time slot, then click Book Session. Razorpay checkout opens after booking (test mode).
                </p>
                {selectedSlot && (
                  <div className="mb-3 space-y-2">
                    <p className="text-sm font-medium text-primary">
                      Selected: {formatDate(selectedSlot.date)} — {formatTime(selectedSlot.startTime)}–{formatTime(selectedSlot.endTime)}
                    </p>
                    <Button
                      onClick={handleBookSession}
                      disabled={bookingLoading || paymentLoading}
                    >
                      {bookingLoading
                        ? 'Creating…'
                        : paymentLoading
                          ? 'Opening payment…'
                          : 'Book Session'}
                    </Button>
                    {createdBookingId && !paymentSuccess && !paymentError && (
                      <p className="text-sm text-muted-foreground">
                        Booking created (ID: {createdBookingId}). Complete payment in the Razorpay window.
                      </p>
                    )}
                    {bookingError && (
                      <p className="text-sm text-destructive" role="alert">
                        {bookingError}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-4">
                  {groupedDates.map((date) => (
                    <div
                      key={date}
                      className="border rounded-lg p-4"
                    >
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {formatDate(date)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupedSlotsByDate[date].map((slot, index) => {
                          const unavailable = isSlotUnavailable(slot);
                          const selected = isSlotSelected(slot);
                          return (
                            <Button
                              key={`${date}-${index}`}
                              type="button"
                              variant={selected ? 'default' : 'outline'}
                              size="sm"
                              disabled={unavailable}
                              onClick={() => handleSlotClick(slot)}
                              className={
                                selected
                                  ? 'ring-2 ring-primary ring-offset-2'
                                  : ''
                              }
                            >
                              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TutorProfile;
