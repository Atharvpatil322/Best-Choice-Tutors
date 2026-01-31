import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import {
  getMyTutorProfile,
  updateMyTutorProfile,
} from '../controllers/tutorController.js';
import { getWallet } from '../controllers/tutorWalletController.js';
import { getMyReceivedReviews, reportReview } from '../controllers/reviewController.js';

const router = express.Router();

// Parse qualifications from FormData (sent as JSON string) so validation sees an array
const parseQualificationsFromBody = (req, res, next) => {
  if (req.body.qualifications !== undefined) {
    if (typeof req.body.qualifications === 'string' && req.body.qualifications.trim()) {
      try {
        req.body.qualifications = JSON.parse(req.body.qualifications);
      } catch {
        req.body.qualifications = [];
      }
    }
    if (!Array.isArray(req.body.qualifications)) {
      req.body.qualifications = [];
    }
  }
  next();
};

// Minimal validation for updating tutor profile via /api/tutor/profile
const updateTutorProfileValidation = [
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Bio must be a string with a reasonable length'),
  body('availabilityTimezone')
    .optional()
    .isString()
    .trim()
    .withMessage('Availability timezone must be a string'),
  body('availabilityWeeklyRules')
    .optional()
    .isArray()
    .withMessage('Availability weekly rules must be an array'),
  body('availabilityExceptions')
    .optional()
    .isArray()
    .withMessage('Availability exceptions must be an array'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('qualifications')
    .optional()
    .isArray()
    .withMessage('Qualifications must be an array'),
  body('qualifications.*.title')
    .optional()
    .isString()
    .trim()
    .withMessage('Qualification title must be a string'),
  body('qualifications.*.institution')
    .optional()
    .isString()
    .trim()
    .withMessage('Qualification institution must be a string'),
  body('qualifications.*.year')
    .optional()
    .isString()
    .trim()
    .withMessage('Qualification year must be a string'),
];

// GET /api/tutor/profile - Get authenticated tutor's profile (tutor only)
router.get(
  '/profile',
  authenticate,
  getMyTutorProfile
);

// GET /api/tutor/wallet - Read-only wallet summary (tutor only, no withdrawals)
router.get('/wallet', authenticate, getWallet);

// GET /api/tutor/reviews - List reviews received by the authenticated tutor (tutor only)
router.get('/reviews', authenticate, getMyReceivedReviews);

// POST /api/tutor/reviews/:reviewId/report - Report a review (tutor only; only owning tutor)
router.post('/reviews/:reviewId/report', authenticate, reportReview);

// PUT /api/tutor/profile - Update authenticated tutor's profile (tutor only)
router.put(
  '/profile',
  authenticate,
  upload.single('profilePhoto'),
  parseQualificationsFromBody,
  updateTutorProfileValidation,
  updateMyTutorProfile
);

export default router;

