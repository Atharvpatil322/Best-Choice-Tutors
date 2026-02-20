import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getBookings } from '../controllers/learnerBookingsController.js';
import { createDispute, submitLearnerEvidenceHandler } from '../controllers/disputeController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/learner/bookings - Get learner bookings (FR-4.1.3, UC-4.3)
// TODO: PHASE 5 DEPENDENCY - Full booking functionality will be implemented in Phase 5
router.get('/bookings', getBookings);

// POST /api/learner/bookings/:bookingId/dispute - Initiate dispute (Phase 10, learner only)
router.post('/bookings/:bookingId/dispute', createDispute);
// PATCH /api/learner/bookings/:bookingId/dispute/evidence - Submit learner evidence (OPEN disputes only)
router.patch('/bookings/:bookingId/dispute/evidence', submitLearnerEvidenceHandler);

export default router;
