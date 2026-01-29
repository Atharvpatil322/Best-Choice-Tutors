import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import {
  getMyTutorProfile,
  updateMyTutorProfile,
} from '../controllers/tutorController.js';

const router = express.Router();

// Minimal validation for updating tutor profile via /api/tutor/profile
const updateTutorProfileValidation = [
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Bio must be a string with a reasonable length'),
  body('phoneNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be a string with a reasonable length'),
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
];

// GET /api/tutor/profile - Get authenticated tutor's profile (tutor only)
router.get(
  '/profile',
  authenticate,
  getMyTutorProfile
);

// PUT /api/tutor/profile - Update authenticated tutor's profile (tutor only)
router.put(
  '/profile',
  authenticate,
  upload.single('profilePhoto'),
  updateTutorProfileValidation,
  updateMyTutorProfile
);

export default router;

