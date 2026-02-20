import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { uploadImage, presignProfilePhotoUrl, deleteProfilePhotoByUrl } from '../services/s3Service.js';

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

    const learningPreferences = (user.gradeLevel || (user.subjectsOfInterest && user.subjectsOfInterest.length > 0) || user.instituteName || user.learningGoal)
      ? {
          gradeLevel: user.gradeLevel || null,
          subjectsOfInterest: user.subjectsOfInterest || [],
          instituteName: user.instituteName ?? null,
          learningGoal: user.learningGoal ?? null,
        }
      : null;

    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.json({
      name: user.name,
      email: user.email,
      profilePhoto,
      phone: user.phone ? { countryCode: user.phone.countryCode ?? null, number: user.phone.number ?? null } : { countryCode: null, number: null },
      gender: user.gender ?? null,
      dob: user.dob ?? null,
      preferredLanguage: user.preferredLanguage ?? null,
      address: user.address ?? null,
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
 * Allowed fields: name, phone, profilePhoto, gradeLevel, subjectsOfInterest,
 * dob, preferredLanguage, address, instituteName, learningGoal (all optional)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user._id;

    if (req.user.role !== 'Learner') {
      return res.status(403).json({ 
        message: 'This endpoint is only accessible to Learners' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, gender, gradeLevel, subjectsOfInterest, dob, preferredLanguage, address, instituteName, learningGoal, clearProfilePhoto } = req.body;

    // Clear profile photo if requested (same behaviour as tutor)
    const wantClearPhoto = clearProfilePhoto === 'true' || clearProfilePhoto === '1' || clearProfilePhoto === true;
    if (wantClearPhoto && user.profilePhoto) {
      await deleteProfilePhotoByUrl(user.profilePhoto);
      user.profilePhoto = null;
    }

    // Update basic details (FR-4.1.1) - Only allowed fields
    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone && typeof phone === 'object') {
        const countryCode = phone.countryCode != null ? String(phone.countryCode).trim() : null;
        const number = phone.number != null ? String(phone.number).trim() : null;
        user.phone = { countryCode: countryCode || null, number: number || null };
      } else {
        user.phone = { countryCode: null, number: null };
      }
    }

    if (gender !== undefined) {
      user.gender = (gender === 'MALE' || gender === 'FEMALE') ? gender : null;
    }
    // Update learning preferences (FR-4.1.2, UC-4.2)
    if (gradeLevel !== undefined) {
      user.gradeLevel = gradeLevel ? gradeLevel.trim() : null;
    }

    if (subjectsOfInterest !== undefined) {
      user.subjectsOfInterest = Array.isArray(subjectsOfInterest) 
        ? subjectsOfInterest.filter(subject => subject && subject.trim()).map(subject => subject.trim())
        : [];
    }
    if (dob !== undefined) {
      user.dob = dob ? new Date(dob) : null;
    }
    if (preferredLanguage !== undefined) {
      user.preferredLanguage = preferredLanguage ? String(preferredLanguage).trim() : null;
    }
    if (address !== undefined) {
      user.address = address ? String(address).trim() : null;
    }
    if (instituteName !== undefined) {
      user.instituteName = instituteName ? String(instituteName).trim() : null;
    }
    if (learningGoal !== undefined) {
      user.learningGoal = learningGoal ? String(learningGoal).trim() : null;
    }

    // Handle profile photo upload if provided (FR-4.1.1). Delete old S3 object when replacing.
    if (req.file) {
      try {
        if (user.profilePhoto) await deleteProfilePhotoByUrl(user.profilePhoto);
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

    const learningPreferences = (user.gradeLevel || (user.subjectsOfInterest && user.subjectsOfInterest.length > 0) || user.instituteName || user.learningGoal)
      ? {
          gradeLevel: user.gradeLevel || null,
          subjectsOfInterest: user.subjectsOfInterest || [],
          instituteName: user.instituteName ?? null,
          learningGoal: user.learningGoal ?? null,
        }
      : null;

    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto);
    res.json({
      message: 'Profile updated successfully',
      name: user.name,
      email: user.email,
      profilePhoto,
      phone: user.phone ? { countryCode: user.phone.countryCode ?? null, number: user.phone.number ?? null } : { countryCode: null, number: null },
      gender: user.gender ?? null,
      dob: user.dob ?? null,
      preferredLanguage: user.preferredLanguage ?? null,
      address: user.address ?? null,
      learningPreferences,
    });
  } catch (error) {
    next(error);
  }
};
