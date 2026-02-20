import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { getProfile, updateProfile } from '../controllers/learnerProfileController.js';
import { getMySubmittedReviews } from '../controllers/reviewController.js';

const router = express.Router();

// Validation rules for profile update (FR-4.1.1, FR-4.1.2 + personal/academic)
// Allowed fields: name, phone, profilePhoto, gradeLevel, subjectsOfInterest, dob, preferredLanguage, address, instituteName, learningGoal
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty if provided'),
  body('phone')
    .optional()
    .custom((value) => value === null || value === undefined || (typeof value === 'object' && value !== null))
    .withMessage('Phone must be an object with countryCode and number'),
  body('phone.countryCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Phone country code must be a string with reasonable length'),
  body('phone.number')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be a string with reasonable length'),
  body('gradeLevel')
    .optional()
    .trim()
    // TODO: CLARIFICATION REQUIRED - Should grade level be validated against a predefined list?
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values (preferences are optional per FR-4.1.2)
      }
      return value.length > 0;
    })
    .withMessage('Grade level cannot be empty if provided'),
  body('subjectsOfInterest')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (!Array.isArray(value)) return false;
      return value.every(subject => typeof subject === 'string' && subject.trim().length > 0);
    })
    .withMessage('Subjects of interest must be an array of non-empty strings'),
  body('dob').optional().custom((v) => v === null || v === undefined || v === '' || !isNaN(Date.parse(v))).withMessage('dob must be a valid date'),
  body('gender').optional().isIn(['MALE', 'FEMALE']).withMessage('gender must be MALE or FEMALE'),
  body('preferredLanguage').optional().trim().isLength({ max: 50 }),
  body('address').optional().trim().isLength({ max: 500 }),
  body('instituteName').optional().trim().isLength({ max: 200 }),
  body('learningGoal').optional().trim().isLength({ max: 1000 }),
];

// All routes require authentication
router.use(authenticate);

// GET /api/learner/profile - Get learner profile
router.get('/profile', getProfile);

// GET /api/learner/reviews - Get reviews submitted by the learner (learner only)
router.get('/reviews', getMySubmittedReviews);

// Middleware to parse JSON string for subjectsOfInterest from FormData
const parseSubjectsOfInterest = (req, res, next) => {
  if (req.body.subjectsOfInterest && typeof req.body.subjectsOfInterest === 'string') {
    try {
      req.body.subjectsOfInterest = JSON.parse(req.body.subjectsOfInterest);
    } catch (error) {
      req.body.subjectsOfInterest = [];
    }
  }
  next();
};

// Middleware to parse JSON string for phone from FormData
const parsePhoneFromBody = (req, res, next) => {
  if (req.body.phone !== undefined && typeof req.body.phone === 'string' && req.body.phone.trim()) {
    try {
      req.body.phone = JSON.parse(req.body.phone);
    } catch (error) {
      req.body.phone = { countryCode: null, number: null };
    }
  }
  next();
};

// PATCH /api/learner/profile - Update learner profile (FR-4.1.1, FR-4.1.2, UC-4.1, UC-4.2)
router.patch(
  '/profile',
  upload.single('profilePhoto'),
  parseSubjectsOfInterest,
  parsePhoneFromBody,
  updateProfileValidation,
  updateProfile
);

export default router;
