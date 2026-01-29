import Booking from '../models/Booking.js';
import { createBookingForSlot, createPaymentOrderForBooking, BookingError } from '../services/bookingService.js';

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
 *   endTime: string (HH:mm)
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

    const { tutorId, date, startTime, endTime } = req.body;

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

    // Delegate core business logic to booking service
    const booking = await createBookingForSlot({
      learnerId: req.user._id,
      tutorId,
      date,
      startTime,
      endTime,
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
        razorpayOrderId: booking.razorpayOrderId,
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
 * Create a Razorpay order for an existing booking
 * Phase 5.3: POST /api/bookings/:id/pay
 *
 * - Learner-only endpoint
 * - Booking must be in PENDING status
 * - Creates a Razorpay order and stores razorpayOrderId on the booking
 *
 * Expected body:
 * {
 *   amount: number (in paise)
 * }
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

    const { order, booking } = await createPaymentOrderForBooking({
      bookingId: id,
      learnerId: req.user._id,
    });

    return res.status(200).json({
      message: 'Payment order created successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        razorpayOrderId: booking.razorpayOrderId,
      },
      order,
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

