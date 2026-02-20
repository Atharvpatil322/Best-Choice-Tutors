import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { generateResetToken, hashResetToken } from '../utils/resetToken.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { uploadImage, presignProfilePhotoUrl } from '../services/s3Service.js';
import { validationResult } from 'express-validator';

// Get current user (for OAuth callback and role checks)
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name email role profilePhoto authProvider status')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Switch role from Learner to Tutor (for "Become a tutor" from learner dashboard or OAuth intended role)
export const switchToTutor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'Learner') {
      return res.status(400).json({
        message: 'Only learners can switch to tutor. Your role is already ' + user.role,
      });
    }
    user.role = 'Tutor';
    await user.save();

    const token = generateToken(user._id);
    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.json({
      message: 'You are now a tutor',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Register with email/password
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, role: requestedRole } = req.body;

    // Allow role from onboarding/signup: only Learner or Tutor (never Admin from self-registration)
    const role =
      requestedRole === 'Tutor' || requestedRole === 'tutor'
        ? 'Tutor'
        : 'Learner';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Handle optional profile photo upload
    let profilePhotoUrl = null;
    if (req.file) {
      try {
        profilePhotoUrl = await uploadImage(req.file.buffer);
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        // Continue registration even if photo upload fails
        // TODO: CLARIFICATION REQUIRED - Should registration fail if photo upload fails?
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'email',
      profilePhoto: profilePhotoUrl,
      role,
    });

    // Generate JWT token
    const token = generateToken(user._id);

    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login with email/password
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user registered with email (has password)
    if (user.authProvider !== 'email' || !user.password) {
      return res.status(401).json({ 
        message: 'This account was created with Google. Please use Google Sign-In.' 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      const message =
        user.status === 'BANNED' ? 'Account is banned' : 'Account is suspended';
      return res.status(403).json({ message });
    }

    const token = generateToken(user._id);
    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Only allow password reset for email-based accounts
    if (user.authProvider !== 'email') {
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    // Save hashed token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error) {
      // Clear token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Do NOT auto-login user after reset (as per requirements)
    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    next(error);
  }
};
