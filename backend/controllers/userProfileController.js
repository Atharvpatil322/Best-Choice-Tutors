/**
 * User Profile Controller
 * GET/PUT /api/user/profile - current user profile (personal & academic fields).
 * Does not affect tutor logic; tutor profile remains in Tutor model.
 */

import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { normalizeSubjects } from '../utils/subjectUtils.js';
import { presignProfilePhotoUrl } from '../services/s3Service.js';

/**
 * GET /api/user/profile
 * Return current user profile including personal and academic fields.
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profilePhoto = await presignProfilePhotoUrl(user.profilePhoto ?? null);
    const profile = {
      name: user.name,
      email: user.email,
      profilePhoto,
      role: user.role,
      phone: user.phone
        ? { countryCode: user.phone.countryCode ?? null, number: user.phone.number ?? null }
        : { countryCode: null, number: null },
      // Personal (optional)
      gender: user.gender ?? null,
      dob: user.dob ?? null,
      preferredLanguage: user.preferredLanguage ?? null,
      address: user.address ?? null,
      // Academic (optional)
      gradeLevel: user.gradeLevel ?? null,
      instituteName: user.instituteName ?? null,
      subjectsOfInterest: Array.isArray(user.subjectsOfInterest) ? user.subjectsOfInterest : [],
      learningGoal: user.learningGoal ?? null,
    };

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/user/profile
 * Update current user profile (personal and academic fields only; all optional).
 */
export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      phone,
      gender,
      dob,
      preferredLanguage,
      address,
      gradeLevel,
      instituteName,
      subjectsOfInterest,
      learningGoal,
    } = req.body;

    if (name !== undefined) {
      user.name = name ? String(name).trim() : user.name;
    }
    if (phone !== undefined) {
      if (phone && typeof phone === 'object') {
        user.phone = {
          countryCode: phone.countryCode != null ? String(phone.countryCode).trim() : null,
          number: phone.number != null ? String(phone.number).trim() : null,
        };
      } else {
        user.phone = { countryCode: null, number: null };
      }
    }

    if (gender !== undefined) {
      user.gender = (gender === 'MALE' || gender === 'FEMALE') ? gender : null;
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
    if (gradeLevel !== undefined) {
      user.gradeLevel = gradeLevel ? String(gradeLevel).trim() : null;
    }
    if (instituteName !== undefined) {
      user.instituteName = instituteName ? String(instituteName).trim() : null;
    }
    if (subjectsOfInterest !== undefined) {
      const raw = Array.isArray(subjectsOfInterest) ? subjectsOfInterest : [];
      const { values, error } = normalizeSubjects(raw);
      if (error) {
        return res.status(400).json({ message: error });
      }
      user.subjectsOfInterest = values;
    }
    if (learningGoal !== undefined) {
      user.learningGoal = learningGoal ? String(learningGoal).trim() : null;
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();

    const profilePhoto = await presignProfilePhotoUrl(updated.profilePhoto ?? null);
    res.json({
      message: 'Profile updated successfully',
      name: updated.name,
      email: updated.email,
      profilePhoto,
      role: updated.role,
      phone: updated.phone
        ? { countryCode: updated.phone.countryCode ?? null, number: updated.phone.number ?? null }
        : { countryCode: null, number: null },
      gender: updated.gender ?? null,
      dob: updated.dob ?? null,
      preferredLanguage: updated.preferredLanguage ?? null,
      address: updated.address ?? null,
      gradeLevel: updated.gradeLevel ?? null,
      instituteName: updated.instituteName ?? null,
      subjectsOfInterest: Array.isArray(updated.subjectsOfInterest) ? updated.subjectsOfInterest : [],
      learningGoal: updated.learningGoal ?? null,
    });
  } catch (error) {
    next(error);
  }
};
