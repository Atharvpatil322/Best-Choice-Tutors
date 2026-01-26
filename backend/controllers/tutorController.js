import Tutor from '../models/Tutor.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { uploadImage } from '../services/cloudinaryService.js';

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

    // Extract tutor data from request body
    const { fullName, bio, subjects, education, experienceYears, hourlyRate, mode, location } = req.body;
    
    // Ensure subjects is an array
    const subjectsArray = Array.isArray(subjects) 
      ? subjects.filter(s => s && s.trim())
      : subjects 
        ? [subjects].filter(s => s && s.trim())
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
          error: error.message 
        });
      }
    }

    // Create tutor profile
    const tutor = await Tutor.create({
      userId,
      fullName,
      bio,
      subjects: subjectsArray,
      education,
      experienceYears: parseInt(experienceYears),
      hourlyRate: parseFloat(hourlyRate),
      mode,
      location: location || null,
      profilePhoto: profilePhotoUrl,
    });

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
        education: tutor.education,
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

    res.json({
      tutors: tutors.map((tutor) => ({
        id: tutor._id,
        userId: tutor.userId._id,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        education: tutor.education,
        experienceYears: tutor.experienceYears,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutor.profilePhoto,
        createdAt: tutor.createdAt,
      })),
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

    res.json({
      tutor: {
        id: tutor._id,
        userId: tutor.userId._id,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        education: tutor.education,
        experienceYears: tutor.experienceYears,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutor.profilePhoto,
        createdAt: tutor.createdAt,
      },
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid tutor ID format' });
    }
    next(error);
  }
};
