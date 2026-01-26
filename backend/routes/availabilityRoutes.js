import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import {
  createAvailability,
  getAvailability,
  updateAvailability,
} from '../controllers/availabilityController.js';

const router = express.Router();

// Validation for weekly rule
const weeklyRuleValidation = body('weeklyRules')
  .optional()
  .isArray()
  .withMessage('Weekly rules must be an array')
  .custom((rules) => {
    if (!Array.isArray(rules)) return false;
    
    for (const rule of rules) {
      if (typeof rule.dayOfWeek !== 'number' || rule.dayOfWeek < 0 || rule.dayOfWeek > 6) {
        throw new Error('Each weekly rule must have dayOfWeek between 0 and 6');
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(rule.startTime)) {
        throw new Error('Each weekly rule startTime must be in HH:mm format');
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(rule.endTime)) {
        throw new Error('Each weekly rule endTime must be in HH:mm format');
      }
      if (rule.startTime >= rule.endTime) {
        throw new Error('Start time must be before end time for each weekly rule');
      }
    }
    
    // Check for duplicate dayOfWeek
    const days = rules.map(r => r.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new Error('Duplicate day of week found in weekly rules');
    }
    
    return true;
  });

// Validation for exception
const exceptionValidation = body('exceptions')
  .optional()
  .isArray()
  .withMessage('Exceptions must be an array')
  .custom((exceptions) => {
    if (!Array.isArray(exceptions)) return false;
    
    for (const exception of exceptions) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.date)) {
        throw new Error('Each exception date must be in YYYY-MM-DD format');
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(exception.startTime)) {
        throw new Error('Each exception startTime must be in HH:mm format');
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(exception.endTime)) {
        throw new Error('Each exception endTime must be in HH:mm format');
      }
      if (exception.startTime >= exception.endTime) {
        throw new Error('Start time must be before end time for each exception');
      }
      if (!['unavailable', 'override'].includes(exception.type)) {
        throw new Error('Each exception type must be either "unavailable" or "override"');
      }
    }
    
    return true;
  });

// Validation rules for creating/updating availability
const availabilityValidation = [
  body('timezone')
    .trim()
    .notEmpty()
    .withMessage('Timezone is required'),
  weeklyRuleValidation,
  exceptionValidation,
];

// POST /api/tutors/me/availability - Create availability (auth, tutor only)
router.post(
  '/me/availability',
  authenticate,
  availabilityValidation,
  createAvailability
);

// GET /api/tutors/me/availability - Get own availability (auth, tutor only)
router.get(
  '/me/availability',
  authenticate,
  getAvailability
);

// PUT /api/tutors/me/availability - Update availability (auth, tutor only)
router.put(
  '/me/availability',
  authenticate,
  availabilityValidation,
  updateAvailability
);

export default router;
