import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload, uploadCertificate, uploadDbsCertificate } from '../middlewares/upload.js';
import {
  getMyTutorProfile,
  getTutorProfileStatus,
  updateMyTutorProfile,
  createPayoutSetupLink,
} from '../controllers/tutorController.js';
import { getWallet } from '../controllers/tutorWalletController.js';
import { getMyReceivedReviews, reportReview } from '../controllers/reviewController.js';
import {
  getMyVerificationDocuments,
  uploadVerificationDocument,
} from '../controllers/tutorVerificationDocumentController.js';
import {
  getMyDbsDocuments,
  uploadDbsDocument,
} from '../controllers/dbsVerificationDocumentController.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
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

// Parse subjects array from FormData (sent as JSON string or multiple values)
const parseSubjectsFromBody = (req, res, next) => {
  if (req.body.subjects !== undefined) {
    if (typeof req.body.subjects === 'string' && req.body.subjects.trim()) {
      try {
        req.body.subjects = JSON.parse(req.body.subjects);
      } catch {
        req.body.subjects = [];
      }
    }
    if (!Array.isArray(req.body.subjects)) {
      req.body.subjects = [];
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
  body('subjects')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one subject is required'),
  body('subjects.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each subject must be a non-empty string'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Hourly rate must be a positive number'),
  body('mode')
    .optional()
    .isIn(['Online', 'In-Person', 'Both'])
    .withMessage('Teaching mode must be Online, In-Person, or Both'),
  body('location')
    .optional()
    .isString()
    .trim()
    .withMessage('Location must be a string'),
  body('location').custom((value, { req }) => {
    const mode = req.body.mode;
    if (mode === 'In-Person' || mode === 'Both') {
      const loc = value != null ? String(value).trim() : '';
      if (!loc) {
        throw new Error('Location is required when teaching mode includes in-person.');
      }
    }
    return true;
  }),
  body('gender').optional().isIn(['MALE', 'FEMALE']).withMessage('gender must be MALE or FEMALE'),
];

// GET /api/tutor/verification-documents - List own verification documents (tutor only, read-only)
router.get('/verification-documents', authenticate, getMyVerificationDocuments);
// POST /api/tutor/verification-documents - Upload verification document (tutor only; PDF or image)
router.post(
  '/verification-documents',
  authenticate,
  uploadCertificate.single('document'),
  uploadVerificationDocument
);

// GET /api/tutor/dbs-documents - List own DBS documents (tutor only)
router.get('/dbs-documents', authenticate, getMyDbsDocuments);
// POST /api/tutor/dbs-documents - Upload DBS certificate (tutor only; PDF or image)
router.post(
  '/dbs-documents',
  authenticate,
  uploadDbsCertificate.single('document'),
  uploadDbsDocument
);

// GET /api/tutor/profile - Get authenticated tutor's profile (tutor only; 200 + needsSetup when no Tutor doc)
router.get(
  '/profile',
  authenticate,
  getMyTutorProfile
);

// GET /api/tutor/profile/status - Lightweight { hasProfile } for sidebar indicator
router.get(
  '/profile/status',
  authenticate,
  getTutorProfileStatus
);

// GET /api/tutor/notifications - List notifications (API-based; no socket required)
router.get('/notifications', authenticate, getMyNotifications);
// PATCH /api/tutor/notifications/read-all - Mark all as read
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);
// PATCH /api/tutor/notifications/:id/read - Mark one as read
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

// GET /api/tutor/wallet - Read-only wallet summary (tutor only)
router.get('/wallet', authenticate, getWallet);

// POST /api/tutor/payout-setup - Create Stripe Connect onboarding link; frontend redirects tutor to Stripe (tutor only)
router.post('/payout-setup', authenticate, createPayoutSetupLink);

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
  parseSubjectsFromBody,
  updateTutorProfileValidation,
  updateMyTutorProfile
);

export default router;

