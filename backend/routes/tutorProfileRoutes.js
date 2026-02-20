import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload, uploadCertificate, uploadDbsCertificate } from '../middlewares/upload.js';
import {
  getMyTutorProfile,
  getTutorProfileStatus,
  updateMyTutorProfile,
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
import {
  getBankDetails,
  upsertBankDetails,
} from '../controllers/tutorBankDetailsController.js';
import {
  createRequest as createWithdrawalRequest,
  getMyRequests as getMyWithdrawalRequests,
} from '../controllers/withdrawalRequestController.js';

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

// GET /api/tutor/wallet - Read-only wallet summary (tutor only, no withdrawals)
router.get('/wallet', authenticate, getWallet);

// GET /api/tutor/bank-details - Get own bank details (masked only; tutor only)
router.get('/bank-details', authenticate, getBankDetails);
// PUT /api/tutor/bank-details - Create or update bank details (tutor only; encrypted at rest)
router.put(
  '/bank-details',
  authenticate,
  [
    body('accountHolderName')
      .trim()
      .notEmpty()
      .withMessage('Account holder name is required'),
    body('bankName').trim().notEmpty().withMessage('Bank name is required'),
    body('accountNumber')
      .trim()
      .notEmpty()
      .withMessage('Account number is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('sortCode')
      .optional()
      .trim()
      .isString()
      .withMessage('Sort code must be a string'),
    body('ifscCode')
      .optional()
      .trim()
      .isString()
      .withMessage('IFSC code must be a string'),
    body().custom((value, { req }) => {
      const country = (req.body.country || '').toString().toUpperCase();
      if (country === 'GB' || country === 'UK') {
        if (!(req.body.sortCode && String(req.body.sortCode).trim())) {
          throw new Error('Sort code is required for United Kingdom');
        }
      } else if (country === 'IN') {
        if (!(req.body.ifscCode && String(req.body.ifscCode).trim())) {
          throw new Error('IFSC code is required for India');
        }
      } else {
        const hasSort = req.body.sortCode && String(req.body.sortCode).trim();
        const hasIfsc = req.body.ifscCode && String(req.body.ifscCode).trim();
        if (!hasSort && !hasIfsc) {
          throw new Error('Either sort code or IFSC code is required');
        }
      }
      return true;
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
  upsertBankDetails
);

// POST /api/tutor/withdrawal-requests - Create withdrawal request (tutor only; does not deduct earnings)
router.post(
  '/withdrawal-requests',
  authenticate,
  [
    body('amountRequestedInPaise')
      .isInt({ min: 0 })
      .withMessage('amountRequestedInPaise must be a non-negative integer (paise)'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
  createWithdrawalRequest
);
// GET /api/tutor/withdrawal-requests - List own withdrawal requests (tutor only)
router.get('/withdrawal-requests', authenticate, getMyWithdrawalRequests);

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

