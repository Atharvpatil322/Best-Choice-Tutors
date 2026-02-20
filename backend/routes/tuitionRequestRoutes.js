import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import {
  createTuitionRequest,
  listMyTuitionRequests,
  closeTuitionRequest,
  withdrawTuitionRequest,
  getInterestedTutorsForRequest,
} from '../controllers/tuitionRequestController.js';

const router = express.Router();

const createValidation = [
  body('subject')
    .optional({ checkFalsy: true })
    .trim(),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('subjects must be an array'),
  body('budget')
    .notEmpty()
    .withMessage('Budget is required')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a non-negative number'),
  body('mode')
    .notEmpty()
    .withMessage('Mode is required')
    .isIn(['ONLINE', 'IN_PERSON', 'EITHER'])
    .withMessage('Mode must be ONLINE, IN_PERSON, or EITHER'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
];

router.use(authenticate);

// GET /api/learner/tuition-requests – list learner's own tuition requests
router.get('/tuition-requests', listMyTuitionRequests);
// POST /api/learner/tuition-requests – create tuition request (learners only)
router.post('/tuition-requests', createValidation, createTuitionRequest);
// PATCH /api/learner/tuition-requests/:requestId/close – close request (learner must own request; sets status = CLOSED)
router.patch('/tuition-requests/:requestId/close', closeTuitionRequest);
// PATCH /api/learner/tuition-requests/:requestId/withdraw – withdraw request (learner only, must be ACTIVE; sets status = CLOSED)
router.patch('/tuition-requests/:requestId/withdraw', withdrawTuitionRequest);
// GET /api/learner/tuition-requests/:requestId/interested-tutors – list tutors who expressed interest (learner must own request)
router.get('/tuition-requests/:requestId/interested-tutors', getInterestedTutorsForRequest);

export default router;
