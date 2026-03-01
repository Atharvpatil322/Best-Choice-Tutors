import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getBookings, getBookingById } from '../controllers/tutorBookingsController.js';

const router = express.Router();

router.use(authenticate);

// GET /api/tutor/bookings - Get authenticated tutor's bookings (read-only list)
router.get('/bookings', getBookings);
// GET /api/tutor/bookings/:bookingId - Get single booking for detail screen
router.get('/bookings/:bookingId', getBookingById);

export default router;
