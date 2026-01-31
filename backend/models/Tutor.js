import mongoose from 'mongoose';

/**
 * Tutor Model
 * Phase 3.1: Tutor model & API skeleton
 * 
 * Separate from User model - represents tutor-specific profile information
 * User model contains authentication and basic user data
 * Tutor model contains professional tutor profile details
 */

const tutorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
      // TODO: CLARIFICATION REQUIRED - Should bio have a minimum/maximum length?
    },
    subjects: {
      type: [String],
      required: [true, 'At least one subject is required'],
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience years cannot be negative'],
    },
    qualifications: {
      type: [
        {
          title: { type: String, trim: true, default: '' },
          institution: { type: String, trim: true, default: '' },
          year: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
      // TODO: CLARIFICATION REQUIRED - Should there be a minimum/maximum rate? What currency?
    },
    mode: {
      type: String,
      enum: ['Online', 'In-Person', 'Both'],
      required: [true, 'Teaching mode is required'],
    },
    location: {
      type: String,
      default: null,
      trim: true,
      // Optional - only required if mode is 'In-Person' or 'Both'
      // TODO: CLARIFICATION REQUIRED - Should location be structured (city, postcode) or free text?
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// Indexes for faster queries
tutorSchema.index({ userId: 1 });
tutorSchema.index({ subjects: 1 }); // For subject-based searches
tutorSchema.index({ mode: 1 }); // For mode-based filtering

const Tutor = mongoose.model('Tutor', tutorSchema);

export default Tutor;
