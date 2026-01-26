import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
      // Password is nullable for Google OAuth users
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      required: [true, 'Auth provider is required'],
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['Learner', 'Tutor', 'Admin'],
      default: 'Learner',
    },
    // Learner profile fields (FR-4.1.1, FR-4.1.2)
    phoneNumber: {
      type: String,
      default: null,
      trim: true,
      // TODO: CLARIFICATION REQUIRED - Should phone number have format validation?
    },
    gradeLevel: {
      type: String,
      default: null,
      trim: true,
      // TODO: CLARIFICATION REQUIRED - What are the valid grade level values? (e.g., "Year 7", "GCSE", "A-Level", etc.)
    },
    subjectsOfInterest: {
      type: [String],
      default: [],
      // TODO: CLARIFICATION REQUIRED - Should subjects be from a predefined list or free text?
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster email lookups
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
