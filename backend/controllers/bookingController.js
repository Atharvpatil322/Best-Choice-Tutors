import Booking from '../models/Booking.js';
import {
  createBookingForSlot,
  createPaymentOrderForBooking,
  getCanReview,
  handleBookingPaid,
  handleBookingFailed,
  rescheduleBooking,
  BookingError,
} from '../services/bookingService.js';

/**
 * Create a new booking
 * Phase 5.1: POST /api/bookings
 *
 * - Learner-only endpoint
 * - Creates a booking with status PENDING
 * - Enforces one booking per slot (via booking service + unique index)
 *
 * Expected body:
 * {
 *   tutorId: string (ObjectId),
 *   date: string (YYYY-MM-DD),
 *   startTime: string (HH:mm),
 *   endTime: string (HH:mm),
 *   requestId?: string (ObjectId) - optional; for request-based negotiated pricing
 * }
 */
export const createBooking = async (req, res, next) => {
  try {
    // Ensure user is a Learner
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can create bookings',
      });
    }

    const { tutorId, date, startTime, endTime, requestId } = req.body;

    // Basic required field validation
    if (!tutorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'tutorId, date, startTime, and endTime are required',
      });
    }

    // Basic time range validation (string comparison is safe for HH:mm)
    if (startTime >= endTime) {
      return res.status(400).json({
        message: 'startTime must be before endTime',
      });
    }

    // Associate booking with the logged-in learner (required for My Bookings visibility)
    const learnerId = req.user._id;
    const booking = await createBookingForSlot({
      learnerId,
      tutorId,
      date,
      startTime,
      endTime,
      requestId: requestId || undefined,
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        learnerId: booking.learnerId,
        tutorId: booking.tutorId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        canReview: getCanReview(booking),
        agreedHourlyRate: booking.agreedHourlyRate,
        tuitionRequestId: booking.tuitionRequestId ?? undefined,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Handle domain booking errors
    if (error instanceof BookingError) {
      return res.status(error.statusCode,).json({ message: error.message });
    }

    // Handle duplicate slot booking (unique index violation) as a safety net
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This slot is already booked for this tutor',
      });
    }

    next(error);
  }
};

/**
 * Create a Stripe Checkout Session for an existing booking
 * POST /api/bookings/:id/pay
 *
 * - Learner-only endpoint
 * - Booking must be in PENDING status
 * - Creates Stripe Checkout Session and stores stripeSessionId, stripePaymentIntentId on the booking
 * - Returns checkoutUrl for frontend redirect (booking is marked PAID by Stripe webhook only)
 */
export const payForBooking = async (req, res, next) => {
  try {
    // Ensure user is a Learner
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can pay for bookings',
      });
    }

    const { id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/dashboard/bookings?payment=success`;
    const cancelUrl = `${baseUrl}/dashboard/bookings?payment=cancelled`;

    const { booking, checkoutUrl, sessionId } = await createPaymentOrderForBooking({
      bookingId: id,
      learnerId: req.user._id,
      successUrl,
      cancelUrl,
    });

    if (!checkoutUrl) {
      return res.status(500).json({ message: 'Failed to create checkout session' });
    }

    return res.status(200).json({
      message: 'Checkout session created successfully',
      checkoutUrl,
      booking: {
        id: booking._id,
        status: booking.status,
        canReview: getCanReview(booking),
        stripeSessionId: sessionId,
      },
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

// DEV TESTING ONLY – REMOVE BEFORE PRODUCTION
// Simulates payment success/failure using the same central handlers as the Stripe webhook.
// Produces identical results: PAID creates earnings, closes tuition request; FAILED does nothing else.
export const updateTestPaymentStatus = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const { id: bookingId } = req.params;
    const { status } = req.body;

    if (!status || !['PAID', 'FAILED'].includes(status)) {
      return res.status(400).json({
        message: 'Body must include status: "PAID" or "FAILED"',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Can only override PENDING bookings. Current status: ' + booking.status,
      });
    }

    if (status === 'PAID') {
      await handleBookingPaid(booking, {});
    } else {
      await handleBookingFailed(booking, {});
    }

    return res.status(200).json({
      message: 'Test payment status updated (DEV only)',
      booking: {
        id: booking._id,
        status: booking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule a booking to a new date/time slot
 * PATCH /api/bookings/:bookingId/reschedule
 *
 * - Learner-only endpoint
 * - Booking must belong to learner
 * - Booking status must be PAID
 * - Booking must not be COMPLETED or CANCELLED
 * - Booking must not be under dispute
 *
 * Expected body:
 * {
 *   date: string (YYYY-MM-DD),
 *   startTime: string (HH:mm),
 *   endTime: string (HH:mm)
 * }
 */
export const rescheduleBookingHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { date, startTime, endTime } = req.body;
    console.log('[Reschedule] Request received', { bookingId, date, startTime, endTime, role: req.user?.role });

    // Ensure user is a Learner
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can reschedule bookings',
      });
    }

    // Basic required field validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'date, startTime, and endTime are required',
      });
    }

    // Associate reschedule with the logged-in learner
    const learnerId = req.user._id;
    const booking = await rescheduleBooking({
      bookingId,
      learnerId,
      date,
      startTime,
      endTime,
    });

    return res.status(200).json({
      message: 'Booking rescheduled successfully',
      booking: {
        id: booking._id,
        learnerId: booking.learnerId,
        tutorId: booking.tutorId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        canReview: getCanReview(booking),
        agreedHourlyRate: booking.agreedHourlyRate,
        tuitionRequestId: booking.tuitionRequestId ?? undefined,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    // Handle domain booking errors
    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

