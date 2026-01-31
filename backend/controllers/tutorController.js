import Tutor from '../models/Tutor.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import { validationResult } from 'express-validator';
import { uploadImage } from '../services/cloudinaryService.js';
import { getTutorRating } from '../services/reviewService.js';

/**
 * Return qualifications for API response. Backward compatibility: if tutor has experienceYears
 * but no qualifications, map to a single qualification entry.
 * @param {Object} tutor - Tutor document (plain or mongoose)
 * @returns {Array<{ title: string, institution: string, year: string }>}
 */
function getQualificationsForResponse(tutor) {
  const quals = tutor.qualifications;
  if (Array.isArray(quals) && quals.length > 0) {
    return quals.map((q) => ({
      title: q.title != null ? String(q.title).trim() : '',
      institution: q.institution != null ? String(q.institution).trim() : '',
      year: q.year != null ? String(q.year).trim() : '',
    }));
  }
  const exp = tutor.experienceYears;
  if (exp != null && Number(exp) >= 0) {
    const years = Number(exp);
    return [
      {
        title: `${years} ${years === 1 ? 'year' : 'years'} teaching experience`,
        institution: '',
        year: String(years),
      },
    ];
  }
  return [];
}

/**
 * Create tutor profile
 * Phase 3.1: Create tutor profile (auth required)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const createTutor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user._id;

    // Check if user already has a tutor profile
    const existingTutor = await Tutor.findOne({ userId });
    if (existingTutor) {
      return res.status(400).json({ 
        message: 'Tutor profile already exists for this user' 
      });
    }

    // Extract tutor data from request body (FormData may send qualifications as JSON string).
    let { fullName, bio, subjects, qualifications, experienceYears, hourlyRate, mode, location } = req.body;
    if (typeof qualifications === 'string' && qualifications.trim()) {
      try {
        qualifications = JSON.parse(qualifications);
      } catch {
        qualifications = [];
      }
    }

    // Ensure subjects is an array
    const subjectsArray = Array.isArray(subjects)
      ? subjects.filter((s) => s && s.trim())
      : subjects
        ? [subjects].filter((s) => s && s.trim())
        : [];

    // Normalize qualifications: array of { title, institution, year }
    const qualificationsArray = Array.isArray(qualifications)
      ? qualifications
          .filter((q) => q && (q.title != null || q.institution != null || q.year != null))
          .map((q) => ({
            title: q.title != null ? String(q.title).trim() : '',
            institution: q.institution != null ? String(q.institution).trim() : '',
            year: q.year != null ? String(q.year).trim() : '',
          }))
      : [];

    // Handle profile photo upload if provided
    let profilePhotoUrl = null;
    if (req.file) {
      try {
        profilePhotoUrl = await uploadImage(req.file.buffer);
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        return res.status(500).json({
          message: 'Failed to upload profile photo',
          error: error.message,
        });
      }
    }

    // Create tutor profile
    const tutor = await Tutor.create({
      userId,
      fullName,
      bio,
      subjects: subjectsArray,
      qualifications: qualificationsArray,
      experienceYears: parseInt(experienceYears, 10),
      hourlyRate: parseFloat(hourlyRate),
      mode,
      location: location || null,
      profilePhoto: profilePhotoUrl,
    });

    // Phase 5.5: Role sync - user becomes a Tutor after creating tutor profile
    // Do not change auth logic; persist role in User document.
    await User.findByIdAndUpdate(userId, { role: 'Tutor' });

    // Populate user reference for response
    await tutor.populate('userId', 'name email');

    res.status(201).json({
      message: 'Tutor profile created successfully',
      tutor: {
        id: tutor._id,
        userId: tutor.userId._id,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutor.profilePhoto,
        createdAt: tutor.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all tutors (public)
 * Phase 3.1: List tutors endpoint
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const listTutors = async (req, res, next) => {
  try {
    // TODO: PHASE 4 - Add filtering, pagination, and sorting
    // For now, return all tutors
    const tutors = await Tutor.find()
      .populate('userId', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 }); // Newest first

    const ratings = await Promise.all(tutors.map((t) => getTutorRating(t._id)));

    res.json({
      tutors: tutors.map((tutor, i) => {
        const userId = tutor.userId && tutor.userId._id ? tutor.userId._id : tutor.userId;
        const { averageRating, reviewCount } = ratings[i];
        return {
          id: tutor._id,
          userId,
          fullName: tutor.fullName || null,
          bio: tutor.bio || null,
          subjects: Array.isArray(tutor.subjects) ? tutor.subjects : [],
          qualifications: getQualificationsForResponse(tutor),
          experienceYears: tutor.experienceYears ?? null,
          hourlyRate: tutor.hourlyRate || null,
          mode: tutor.mode || null,
          location: tutor.location || null,
          profilePhoto: tutor.profilePhoto || null,
          createdAt: tutor.createdAt || null,
          averageRating,
          reviewCount,
        };
      }),
      count: tutors.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tutor by ID (public)
 * Phase 3.1: View tutor endpoint
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tutor = await Tutor.findById(id).populate('userId', 'name email');

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const userId = tutor.userId && tutor.userId._id ? tutor.userId._id : tutor.userId;
    const { averageRating, reviewCount } = await getTutorRating(tutor._id);

    res.json({
      tutor: {
        id: tutor._id,
        userId,
        fullName: tutor.fullName || null,
        bio: tutor.bio || null,
        subjects: Array.isArray(tutor.subjects) ? tutor.subjects : [],
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate || null,
        mode: tutor.mode || null,
        location: tutor.location || null,
        profilePhoto: tutor.profilePhoto || null,
        createdAt: tutor.createdAt || null,
        averageRating,
        reviewCount,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid tutor ID format' });
    }
    next(error);
  }
};

/**
 * Get authenticated tutor's own profile
 * GET /api/tutor/profile
 *
 * Authenticated tutor only.
 * Returns tutor profile data linked to the current user.
 */
export const getMyTutorProfile = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Role must be Tutor
    if (user.role !== 'Tutor') {
      return res.status(403).json({ message: 'Access denied: Tutor role required' });
    }

    const tutor = await Tutor.findOne({ userId: user._id });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    const phone =
      user.phone && (user.phone.countryCode || user.phone.number)
        ? {
            countryCode: user.phone.countryCode || null,
            number: user.phone.number || null,
          }
        : null;

    const { averageRating, reviewCount } = await getTutorRating(tutor._id);

    res.json({
      tutor: {
        id: tutor._id,
        userId: tutor.userId,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutor.profilePhoto,
        createdAt: tutor.createdAt,
        averageRating,
        reviewCount,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated tutor's own profile and availability
 * PUT /api/tutor/profile
 *
 * Authenticated tutor only.
 * Allows updating:
 * - bio (existing Tutor field)
 * - profilePhoto (via multipart/form-data)
 * - phone (on User model: countryCode, number)
 * - availability rules + exceptions (Availability model)
 *
 * Does NOT allow updating email.
 */
export const updateMyTutorProfile = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Role must be Tutor
    if (user.role !== 'Tutor') {
      return res.status(403).json({ message: 'Access denied: Tutor role required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const tutor = await Tutor.findOne({ userId: user._id });
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    const {
      bio,
      qualifications: qualificationsPayload,
      experienceYears: experienceYearsPayload,
      phone,
      availabilityTimezone,
      availabilityWeeklyRules,
      availabilityExceptions,
    } = req.body;

    // Update tutor bio if provided
    if (bio !== undefined) {
      tutor.bio = bio.trim();
    }

    // Update experience years if provided
    if (experienceYearsPayload !== undefined) {
      const parsed = parseInt(experienceYearsPayload, 10);
      if (Number.isInteger(parsed) && parsed >= 0) {
        tutor.experienceYears = parsed;
      }
    }

    // Update qualifications if provided
    if (qualificationsPayload !== undefined) {
      const parsed =
        typeof qualificationsPayload === 'string'
          ? (() => {
              try {
                return JSON.parse(qualificationsPayload);
              } catch {
                return [];
              }
            })()
          : qualificationsPayload;
      tutor.qualifications = Array.isArray(parsed)
        ? parsed
            .filter((q) => q && (q.title != null || q.institution != null || q.year != null))
            .map((q) => ({
              title: q.title != null ? String(q.title).trim() : '',
              institution: q.institution != null ? String(q.institution).trim() : '',
              year: q.year != null ? String(q.year).trim() : '',
            }))
        : [];
    }

    // Handle optional profile photo upload
    if (req.file) {
      try {
        const profilePhotoUrl = await uploadImage(req.file.buffer);
        tutor.profilePhoto = profilePhotoUrl;
      } catch (error) {
        console.error('Error uploading tutor profile photo:', error);
        return res.status(500).json({
          message: 'Failed to upload profile photo',
          error: error.message,
        });
      }
    }

    await tutor.save();

    // Parse and validate structured phone object if provided
    if (phone !== undefined) {
      let parsedPhone = null;
      if (typeof phone === 'string' && phone.trim() !== '') {
        try {
          parsedPhone = JSON.parse(phone);
        } catch (err) {
          return res.status(400).json({ message: 'Invalid phone format: must be a JSON object' });
        }
      } else if (typeof phone === 'object' && phone !== null) {
        parsedPhone = phone;
      }

      if (parsedPhone) {
        const countryCode = parsedPhone.countryCode || null;
        const number = parsedPhone.number || null;

        // Simple validation: enforce rules based on countryCode
        if (countryCode === '+91' && number) {
          if (!/^\d{10}$/.test(number)) {
            return res.status(400).json({
              message: 'For +91, phone number must be exactly 10 digits.',
            });
          }
        }

        user.phone = { countryCode, number };
      } else {
        user.phone = { countryCode: null, number: null };
      }

      await user.save();
    }

    // Update availability if any availability fields are present
    const hasAvailabilityPayload =
      availabilityTimezone !== undefined ||
      availabilityWeeklyRules !== undefined ||
      availabilityExceptions !== undefined;

    let updatedAvailability = null;

    if (hasAvailabilityPayload) {
      // Find or create availability for this tutor
      let availability = await Availability.findOne({ tutorId: tutor._id });

      if (!availability) {
        // If no availability exists yet, create a new document
        availability = new Availability({
          tutorId: tutor._id,
          timezone: availabilityTimezone || 'Europe/London',
          weeklyRules: Array.isArray(availabilityWeeklyRules)
            ? availabilityWeeklyRules
            : [],
          exceptions: Array.isArray(availabilityExceptions)
            ? availabilityExceptions
            : [],
        });
      } else {
        if (availabilityTimezone !== undefined) {
          availability.timezone = availabilityTimezone;
        }
        if (availabilityWeeklyRules !== undefined) {
          availability.weeklyRules = Array.isArray(availabilityWeeklyRules)
            ? availabilityWeeklyRules
            : [];
        }
        if (availabilityExceptions !== undefined) {
          availability.exceptions = Array.isArray(availabilityExceptions)
            ? availabilityExceptions
            : [];
        }
      }

      await availability.save();

      updatedAvailability = {
        id: availability._id,
        tutorId: availability.tutorId,
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      };
    }

    // Normalize phone for response
    let phoneResponse = null;
    if (user.phone && (user.phone.countryCode || user.phone.number)) {
      phoneResponse = {
        countryCode: user.phone.countryCode || null,
        number: user.phone.number || null,
      };
    }

    res.json({
      message: 'Tutor profile updated successfully',
      tutor: {
        id: tutor._id,
        userId: tutor.userId,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutor.profilePhoto,
        createdAt: tutor.createdAt,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: phoneResponse,
        profilePhoto: user.profilePhoto || null,
      },
      availability: updatedAvailability,
    });
  } catch (error) {
    next(error);
  }
};
