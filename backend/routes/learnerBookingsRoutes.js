import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getBookings,
  getFirstSessionDiscountEligibility,
} from '../controllers/learnerBookingsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/learner/bookings - Get learner bookings (FR-4.1.3, UC-4.3)
router.get('/bookings', getBookings);

// GET /api/learner/bookings/first-session-discount-eligibility - First-session discount flag
router.get('/bookings/first-session-discount-eligibility', getFirstSessionDiscountEligibility);

export default router;
