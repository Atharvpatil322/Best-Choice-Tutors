import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { getProfile, updateProfile } from '../controllers/learnerProfileController.js';

const router = express.Router();

// Validation rules for profile update (FR-4.1.1, FR-4.1.2, UC-4.1, UC-4.2)
// Allowed fields: name, phoneNumber, profilePhoto, gradeLevel, subjectsOfInterest
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty if provided'),
  body('phoneNumber')
    .optional()
    .trim()
    // TODO: CLARIFICATION REQUIRED - Should phone number have format validation? (e.g., UK phone format)
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values
      }
      // Basic validation - can be enhanced with specific format requirements
      return value.length >= 10; // Minimum length check
    })
    .withMessage('Phone number must be at least 10 characters if provided'),
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
      // Allow null, undefined, or empty array (preferences are optional per FR-4.1.2)
      if (value === null || value === undefined) {
        return true;
      }
      // Must be an array if provided
      if (!Array.isArray(value)) {
        return false;
      }
      // All items must be non-empty strings
      return value.every(subject => typeof subject === 'string' && subject.trim().length > 0);
    })
    .withMessage('Subjects of interest must be an array of non-empty strings'),
  // Note: profilePhoto is handled via multipart/form-data upload, not validated here
];

// All routes require authentication
router.use(authenticate);

// GET /api/learner/profile - Get learner profile
router.get('/profile', getProfile);

// Middleware to parse JSON string for subjectsOfInterest from FormData
const parseSubjectsOfInterest = (req, res, next) => {
  if (req.body.subjectsOfInterest && typeof req.body.subjectsOfInterest === 'string') {
    try {
      req.body.subjectsOfInterest = JSON.parse(req.body.subjectsOfInterest);
    } catch (error) {
      // If parsing fails, treat as empty array
      req.body.subjectsOfInterest = [];
    }
  }
  next();
};

// PATCH /api/learner/profile - Update learner profile (FR-4.1.1, FR-4.1.2, UC-4.1, UC-4.2)
router.patch(
  '/profile',
  upload.single('profilePhoto'), // Optional profile photo upload
  parseSubjectsOfInterest, // Parse JSON string for subjectsOfInterest
  updateProfileValidation,
  updateProfile
);

export default router;
