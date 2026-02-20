/**
 * Tutor Profile View Page (Learner)
 * UI task: Tutor Profile View for learners
 * 
 * Features:
 * - Fetches tutor details using GET /api/tutors/:id
 * - Displays: profile photo, name, bio, subjects, qualifications, experience, hourly rate, mode, location
 * - Fetches availability from GET /api/tutors/:id/availability
 * - Fetches slots from GET /api/tutors/:id/slots
 * - Displays upcoming slots (date, startTime, endTime)
 * - Learner can select ONE available slot, create booking, then pay via Razorpay checkout (test mode).
 * - Public, read-only page
 * - No availability editing
 * - No webhook logic; success/failure handled in frontend callbacks only.
 * - Wallet lifecycle: frontend Razorpay success callback MUST NOT update wallet or booking status.
 *   Wallet state depends only on backend (Razorpay webhook payment.captured → ledger pendingRelease;
 *   session completion → ledger available). Do not call any wallet or booking-status API on success.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Info, Star, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { getTutorById, getTutorAvailability, getTutorSlots } from '@/services/tutorService';
import { createBooking, updateTestPaymentStatus } from '@/services/bookingService.js';
import { getCurrentRole } from '@/services/authService';
import { createBookingPaymentOrder } from '@/services/bookingPaymentService.js';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay.js';
import { toast } from 'sonner';
import '../../styles/Profile.css';

function TutorProfile({ tutorId: propTutorId }) {
  const { id: routeId } = useParams();
  const id = propTutorId || routeId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromRequestId = searchParams.get('fromRequest') || null;
  const fromRequestBudget = searchParams.get('fromRequestBudget');
  const role = getCurrentRole();
  const isTutor = typeof role === 'string' && role.toLowerCase() === 'tutor';
  const bookingsPath = isTutor ? '/tutor/bookings' : '/dashboard/bookings';
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
  /** Confirm booking dialog (open on Book Session click; Continue opens age consent) */
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  /** Age eligibility & parental consent dialog (after confirm; Proceed to Payment runs booking + payment) */
  const [ageConsentDialogOpen, setAgeConsentDialogOpen] = useState(false);
  const [ageConsentChecked, setAgeConsentChecked] = useState(false);

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
        ...(fromRequestId ? { requestId: fromRequestId } : {}),
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
          // DEV TESTING ONLY: when Razorpay test success doesn't trigger webhook, sync booking status so UI reflects PAID
          if (import.meta.env.DEV && bookingIdToPay) {
            updateTestPaymentStatus(bookingIdToPay, 'PAID').catch(() => {});
          }
          setPaymentSuccess(true);
          setPaymentError(null);
          toast.success('Payment successful. Your booking is confirmed.');
        },
        onDismiss(reason) {
          // DEV TESTING ONLY: when tester selects Failure in Razorpay test modal, mark booking as FAILED
          if (reason === 'failed' && import.meta.env.DEV && bookingIdToPay) {
            updateTestPaymentStatus(bookingIdToPay, 'FAILED').catch(() => {});
          }
          if (reason === 'failed') {
            setPaymentError('Your payment transaction failed. Please try a different card or method.');
          } else {
            setPaymentError('Payment was cancelled. You can retry using the button below.');
          }
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
      <div className="profile-page-content space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-8">
            <p className="text-center text-slate-500">Loading tutor profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page-content space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-8 space-y-4">
            <p className="text-center text-red-600">{error}</p>
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard/browse-tutors">Back to Browse Tutors</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="profile-page-content space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-8 space-y-4">
            <p className="text-center text-slate-500">Tutor not found</p>
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard/browse-tutors">Back to Browse Tutors</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const locationDisplay = tutor.location
    ? (typeof tutor.location === 'object' ? tutor.location.address : tutor.location)
    : null;

  return (
    <div className="profile-page-content space-y-6 pb-12">
      <div className="profile-intro flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a365d]">Tutor Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tutor.fullName || 'Tutor'}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/browse-tutors">Browse Tutors</Link>
        </Button>
      </div>

      {/* Hero banner – same structure as Tutor My Profile */}
      <div className="profile-hero-banner mt-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-shrink-0">
            {tutor.profilePhoto ? (
              <img
                src={tutor.profilePhoto}
                alt={tutor.fullName || 'Tutor'}
                className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 text-white">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{tutor.fullName || 'Tutor'}</h2>
            <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
              {tutor.mode && <span>{tutor.mode}</span>}
              {locationDisplay && (
                <>
                  {tutor.mode && <span> · </span>}
                  <MapPin size={14} className="shrink-0" /> {locationDisplay}
                </>
              )}
            </p>
            {tutor.reviewCount != null && tutor.reviewCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-white/90">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-4 w-4 ${
                        value <= Math.round(Number(tutor.averageRating) || 0)
                          ? 'fill-amber-300 text-amber-300'
                          : 'text-white/40'
                      }`}
                    />
                  ))}
                </div>
                <span>
                  {(Number(tutor.averageRating) || 0).toFixed(1)} · {tutor.reviewCount}{' '}
                  {tutor.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information – section card pattern */}
      <Card className="profile-section-card">
        <div className="section-header">
          <h3>Profile Information</h3>
        </div>
        <div className="section-grid">
          {tutor.bio && (
            <div className="info-block col-span-full">
              <label>About</label>
              <p className="whitespace-pre-wrap font-normal">{tutor.bio}</p>
            </div>
          )}
          <div className="info-block">
            <label>Qualifications</label>
            <p>
              {tutor.qualifications && tutor.qualifications.length > 0 ? (
                tutor.qualifications.map((q, i) => [q.title, q.institution, q.year].filter(Boolean).join(', ')).join(' · ')
              ) : (
                <Placeholder />
              )}
            </p>
          </div>
          <div className="info-block">
            <label>Years of Experience</label>
            <p>
              {tutor.experienceYears !== undefined && tutor.experienceYears !== null ? (
                `${tutor.experienceYears} ${tutor.experienceYears === 1 ? 'year' : 'years'}`
              ) : (
                <Placeholder />
              )}
            </p>
          </div>
          <div className="info-block">
            <label>Hourly Rate</label>
            <p>
              {tutor.hourlyRate !== undefined && tutor.hourlyRate !== null ? (
                `£${parseFloat(tutor.hourlyRate).toFixed(2)}/hour`
              ) : (
                <Placeholder />
              )}
            </p>
          </div>
          <div className="info-block">
            <label>Teaching Mode</label>
            <p>{tutor.mode || <Placeholder />}</p>
          </div>
          {locationDisplay && (
            <div className="info-block">
              <label>Location</label>
              <p>{locationDisplay}</p>
            </div>
          )}
          {tutor.subjects && tutor.subjects.length > 0 && (
            <div className="info-block col-span-full">
              <label>Subjects</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tutor.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-[#1A365D]"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

        {/* Booking confirmation (payment success) */}
        {paymentSuccess && selectedSlot && tutor && (
          <Card className="profile-section-card border-green-200 bg-green-50/50">
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
                {fromRequestId && fromRequestBudget != null && fromRequestBudget !== '' && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Rate</dt>
                    <dd className="font-medium">£{Number(fromRequestBudget).toFixed(2)}/hr (request-based)</dd>
                  </div>
                )}
                {createdBookingId && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Booking ID</dt>
                    <dd className="font-mono text-xs">{createdBookingId}</dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="default">
                  <Link to={bookingsPath}>View my bookings</Link>
                </Button>
                <Button variant="outline" onClick={handleBookAnother}>
                  Book another session
                </Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 mb-4 border border-blue-100">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Your payment was successful! It may take a minute for your booking status to update in your dashboard while we verify the transaction.
                  </p>
                </div>
            </CardContent>
          </Card>
        )}

        {/* Payment failed / pending (retry option) */}
        {paymentError && createdBookingId && !paymentSuccess && (
          <Card className="profile-section-card border-destructive/50 bg-destructive/5">
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
                  <Link to={bookingsPath}>View my bookings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability & Slots */}
        <Card className="profile-section-card">
          <div className="section-header">
            <h3>Available Time Slots</h3>
          </div>
          <CardContent className="pt-0">
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
                {fromRequestId && fromRequestBudget != null && fromRequestBudget !== '' && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 mb-4">
                    <p className="text-sm font-medium text-emerald-800">
                      Request-based pricing: you will pay £{Number(fromRequestBudget).toFixed(2)}/hr for this booking (from your tuition request).
                    </p>
                  </div>
                )}
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
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={bookingLoading || paymentLoading}
                    >
                      {bookingLoading
                        ? 'Creating…'
                        : paymentLoading
                          ? 'Opening payment…'
                          : 'Book Session'}
                    </Button>

                    <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to book the following slot. The slot will be reserved only after successful payment.
                            <span className="mt-2 block font-medium text-foreground">
                              {formatDate(selectedSlot.date)} — {formatTime(selectedSlot.startTime)}–{formatTime(selectedSlot.endTime)}
                            </span>
                            Continue to complete age eligibility and payment?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setConfirmDialogOpen(false);
                              setAgeConsentChecked(false);
                              setAgeConsentDialogOpen(true);
                            }}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Age Eligibility & Parental Consent — must confirm before payment */}
                    <AlertDialog open={ageConsentDialogOpen} onOpenChange={(open) => {
                      setAgeConsentDialogOpen(open);
                      if (!open) setAgeConsentChecked(false);
                    }}>
                      <AlertDialogContent className="max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Age Eligibility & Parental Consent Confirmation</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-left text-sm text-muted-foreground">
                              <p>
                                By proceeding with this booking, you confirm that you are at least 13 years of age.
                              </p>
                              <p>
                                If you are under the age of 18, you confirm that you have obtained the consent of your parent or legal guardian to use this platform and to participate in tutoring sessions.
                              </p>
                              <p>
                                The platform does not knowingly allow individuals under the age of 13 to create accounts or book sessions. If you are under 13 years old, you must not proceed.
                              </p>
                              <p>
                                By checking the box below, you acknowledge and agree to the above age eligibility requirements.
                              </p>
                              <label className="flex items-start gap-3 cursor-pointer mt-4 p-3 rounded-lg border border-input bg-muted/30 hover:bg-muted/50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={ageConsentChecked}
                                  onChange={(e) => setAgeConsentChecked(e.target.checked)}
                                  className="mt-1 h-4 w-4 rounded border-input"
                                  aria-describedby="age-consent-label"
                                />
                                <span id="age-consent-label" className="text-sm text-foreground">
                                  I confirm that I meet the age eligibility requirements and, if required, have parental/guardian consent.
                                </span>
                              </label>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button
                            onClick={() => {
                              setAgeConsentDialogOpen(false);
                              setAgeConsentChecked(false);
                              handleBookSession();
                            }}
                            disabled={!ageConsentChecked}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Proceed to Payment
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                <Accordion type="single" collapsible className="w-full">
                  {groupedDates.map((date) => (
                    <AccordionItem key={date} value={date}>
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        {formatDate(date)}
                      </AccordionTrigger>
                      <AccordionContent>
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
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default TutorProfile;
