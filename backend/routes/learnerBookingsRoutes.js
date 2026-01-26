import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getBookings } from '../controllers/learnerBookingsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/learner/bookings - Get learner bookings (FR-4.1.3, UC-4.3)
// TODO: PHASE 5 DEPENDENCY - Full booking functionality will be implemented in Phase 5
router.get('/bookings', getBookings);

export default router;
