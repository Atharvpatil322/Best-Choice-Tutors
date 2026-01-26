import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { createTutor, listTutors, getTutorById } from '../controllers/tutorController.js';

const router = express.Router();

// Middleware to parse subjects array from FormData
const parseSubjectsArray = (req, res, next) => {
  // FormData sends multiple values with same key as array
  // If subjects is already an array, use it; otherwise convert to array
  if (req.body.subjects) {
    if (!Array.isArray(req.body.subjects)) {
      req.body.subjects = [req.body.subjects].filter(Boolean);
    } else {
      // Filter out empty values
      req.body.subjects = req.body.subjects.filter(s => s && s.trim());
    }
  }
  next();
};

// Validation rules for creating tutor profile
const createTutorValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('bio')
    .trim()
    .notEmpty()
    .withMessage('Bio is required'),
  body('subjects')
    .custom((value) => {
      // Accept array or single string
      const subjects = Array.isArray(value) ? value : [value];
      if (subjects.length === 0 || subjects.every(s => !s || !s.trim())) {
        return false;
      }
      return subjects.every(subject => typeof subject === 'string' && subject.trim().length > 0);
    })
    .withMessage('At least one subject is required and all subjects must be non-empty strings'),
  body('education')
    .trim()
    .notEmpty()
    .withMessage('Education is required'),
  body('experienceYears')
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('hourlyRate')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number'),
  body('mode')
    .isIn(['Online', 'In-Person', 'Both'])
    .withMessage('Mode must be one of: Online, In-Person, Both'),
  body('location')
    .optional()
    .trim()
    .custom((value, { req }) => {
      // Location is optional, but if mode is In-Person or Both, it might be required
      // TODO: CLARIFICATION REQUIRED - Should location be required for In-Person or Both modes?
      return true;
    }),
  // Note: profilePhoto is handled via multipart/form-data upload, not validated here
];

// POST /api/tutors - Create tutor profile (auth required)
router.post(
  '/',
  authenticate, // Auth required for creating tutor profile
  upload.single('profilePhoto'), // Optional profile photo upload
  parseSubjectsArray, // Parse subjects array from FormData
  createTutorValidation,
  createTutor
);

// GET /api/tutors - List all tutors (public)
router.get('/', listTutors);

// GET /api/tutors/:id - Get tutor by ID (public)
router.get('/:id', getTutorById);

export default router;
