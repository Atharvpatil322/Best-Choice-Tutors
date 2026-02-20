import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { getProfile, updateProfile } from '../controllers/userProfileController.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided'),
  body('phone')
    .optional()
    .custom((v) => v === null || v === undefined || (typeof v === 'object' && v !== null))
    .withMessage('Phone must be an object with countryCode and number'),
  body('phone.countryCode').optional().trim().isLength({ max: 10 }),
  body('phone.number').optional().trim().isLength({ max: 20 }),
  body('dob').optional().custom((v) => v === null || v === undefined || !isNaN(Date.parse(v))).withMessage('dob must be a valid date'),
  body('gender').optional().isIn(['MALE', 'FEMALE']).withMessage('gender must be MALE or FEMALE'),
  body('preferredLanguage').optional().trim().isLength({ max: 50 }),
  body('address').optional().trim().isLength({ max: 500 }),
  body('gradeLevel').optional().trim().isLength({ max: 100 }),
  body('instituteName').optional().trim().isLength({ max: 200 }),
  body('subjectsOfInterest')
    .optional()
    .custom((v) => v === null || v === undefined || (Array.isArray(v) && v.every((s) => typeof s === 'string')))
    .withMessage('subjectsOfInterest must be an array of strings'),
  body('learningGoal').optional().trim().isLength({ max: 1000 }),
];

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);

// Notifications (any authenticated user: learner or tutor)
router.get('/notifications', getMyNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
