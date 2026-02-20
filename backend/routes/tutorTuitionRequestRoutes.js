import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getActiveTuitionRequestsForTutor,
  expressInterest,
} from '../controllers/tuitionRequestController.js';

const router = express.Router();

router.use(authenticate);

// GET /api/tutor/tuition-requests – list active tuition requests (verified tutors only, read-only)
router.get('/tuition-requests', getActiveTuitionRequestsForTutor);
// POST /api/tutor/tuition-requests/:requestId/interest – express interest (verified tutors only, once per request)
router.post('/tuition-requests/:requestId/interest', expressInterest);

export default router;
