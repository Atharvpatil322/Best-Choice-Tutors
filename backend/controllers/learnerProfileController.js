import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { uploadImage } from '../services/cloudinaryService.js';

/**
 * Get learner profile
 * FR-4.1.1, FR-4.1.2: Returns basic details and learning preferences
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Ensure user is a Learner
    if (req.user.role !== 'Learner') {
      return res.status(403).json({ 
        message: 'This endpoint is only accessible to Learners' 
      });
    }

    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return learner profile data
    // Structure learningPreferences as an object if gradeLevel or subjectsOfInterest exist
    const learningPreferences = (user.gradeLevel || (user.subjectsOfInterest && user.subjectsOfInterest.length > 0))
      ? {
          gradeLevel: user.gradeLevel || null,
          subjectsOfInterest: user.subjectsOfInterest || [],
        }
      : null;

    res.json({
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      phoneNumber: user.phoneNumber,
      learningPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update learner profile
 * FR-4.1.1: Update basic details (Name, Profile Picture, Phone Number)
 * FR-4.1.2: Update learning preferences (Grade Level, Subjects of Interest)
 * UC-4.1: Learner Updates Basic Profile Information
 * UC-4.2: Learner Sets Learning Preferences
 * 
 * Allowed fields: name, phoneNumber, profilePhoto, gradeLevel, subjectsOfInterest
 * Restricted: email (cannot change), role (cannot change), tutor fields (not applicable)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user._id;

    // Ensure user is a Learner
    if (req.user.role !== 'Learner') {
      return res.status(403).json({ 
        message: 'This endpoint is only accessible to Learners' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract updatable fields from request body (only allowed fields)
    const { name, phoneNumber, gradeLevel, subjectsOfInterest } = req.body;

    // Update basic details (FR-4.1.1) - Only allowed fields
    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    }

    // Update learning preferences (FR-4.1.2, UC-4.2)
    if (gradeLevel !== undefined) {
      user.gradeLevel = gradeLevel ? gradeLevel.trim() : null;
    }

    if (subjectsOfInterest !== undefined) {
      // Ensure it's an array and filter out empty values
      user.subjectsOfInterest = Array.isArray(subjectsOfInterest) 
        ? subjectsOfInterest.filter(subject => subject && subject.trim()).map(subject => subject.trim())
        : [];
    }

    // Handle profile photo upload if provided (FR-4.1.1)
    if (req.file) {
      try {
        const profilePhotoUrl = await uploadImage(req.file.buffer);
        user.profilePhoto = profilePhotoUrl;
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        return res.status(500).json({ 
          message: 'Failed to upload profile photo',
          error: error.message 
        });
      }
    }

    await user.save();

    // Return updated profile (matching GET response format)
    const learningPreferences = (user.gradeLevel || (user.subjectsOfInterest && user.subjectsOfInterest.length > 0))
      ? {
          gradeLevel: user.gradeLevel || null,
          subjectsOfInterest: user.subjectsOfInterest || [],
        }
      : null;

    res.json({
      message: 'Profile updated successfully',
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      phoneNumber: user.phoneNumber,
      learningPreferences,
    });
  } catch (error) {
    next(error);
  }
};
