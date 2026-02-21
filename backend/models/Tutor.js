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
    // location: {
    //   type: String,
    //   default: null,
    //   trim: true,
    // },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: { type: String, trim: true }, // The readable city/address string
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    /** Set when admin rejects verification; used to exclude from pending list. */
    verificationRejectedAt: {
      type: Date,
      default: null,
    },
    /** DBS verification status; independent of isVerified (qualification verification). */
    isDbsVerified: {
      type: Boolean,
      default: false,
    },
    /** Stripe Connect Express account ID (e.g. acct_xxx). One per tutor; set when onboarding starts. */
    stripeAccountId: {
      type: String,
      default: null,
      trim: true,
    },
    /** Stripe Connect onboarding state: NOT_STARTED | PENDING | COMPLETED | FAILED. Updated by account.updated webhook. */
    stripeOnboardingStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'COMPLETED', 'FAILED'],
      default: 'NOT_STARTED',
    },
    /** From Stripe account.updated: account can accept charges. */
    chargesEnabled: {
      type: Boolean,
      default: false,
    },
    /** From Stripe account.updated: account can receive payouts. */
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    /** Last error message from onboarding (e.g. from Stripe or link creation). Cleared when COMPLETED. */
    lastOnboardingError: {
      type: String,
      default: null,
      trim: true,
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

// userId has unique: true (creates index). Other indexes:
tutorSchema.index({ subjects: 1 }); // For subject-based searches
tutorSchema.index({ mode: 1 }); // For mode-based filtering
tutorSchema.index({ "location.coordinates": "2dsphere" });
tutorSchema.index({ stripeAccountId: 1 }, { sparse: true }); // For account.updated webhook

const Tutor = mongoose.model('Tutor', tutorSchema);

export default Tutor;
