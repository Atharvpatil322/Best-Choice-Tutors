import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createBooking,
  payForBooking,
  updateTestPaymentStatus,
  rescheduleBookingHandler,
} from '../controllers/bookingController.js';
import { submitReview } from '../controllers/reviewController.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings - Create a new booking with status PENDING
router.post('/', createBooking);

// POST /api/bookings/:id/pay - Create Stripe Checkout Session for a booking
router.post('/:id/pay', payForBooking);

// DEV TESTING ONLY – REMOVE BEFORE PRODUCTION: override payment status when webhook is not updating (test mode)
router.patch('/:id/test-payment-status', updateTestPaymentStatus);

// POST /api/bookings/:id/review - Submit a review for a completed booking (learner only)
router.post('/:id/review', submitReview);

// PATCH /api/bookings/:bookingId/reschedule - Reschedule a booking to a new date/time slot (learner only)
router.patch('/:bookingId/reschedule', rescheduleBookingHandler);

export default router;

