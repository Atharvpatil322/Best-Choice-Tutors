import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createBooking, payForBooking } from '../controllers/bookingController.js';
import { submitReview } from '../controllers/reviewController.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings - Create a new booking with status PENDING
router.post('/', createBooking);

// POST /api/bookings/:id/pay - Create a Razorpay order for a booking
router.post('/:id/pay', payForBooking);

// POST /api/bookings/:id/review - Submit a review for a completed booking (learner only)
router.post('/:id/review', submitReview);

export default router;

