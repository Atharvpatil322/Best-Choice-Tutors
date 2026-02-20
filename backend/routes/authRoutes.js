import express from 'express';
import { body } from 'express-validator';
import passport from '../config/passport.js';
import {
  register,
  login,
  getMe,
  switchToTutor,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { googleCallback } from '../controllers/googleAuthController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Email/Password Authentication
router.post('/register', upload.single('profilePhoto'), registerValidation, register);
router.post('/login', loginValidation, login);

// Current user and role switch (authenticated)
router.get('/me', authenticate, getMe);
router.post('/switch-to-tutor', authenticate, switchToTutor);

// Google OAuth Authentication
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// Password Reset
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);

export default router;
