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
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'BANNED'],
      default: 'ACTIVE',
      index: true,
    },
    phone: {
      countryCode: {
        type: String,
        default: null,
        trim: true,
      },
      number: {
        type: String,
        default: null,
        trim: true,
      },
    },
    // Personal (learner profile extension)
    gender: {
      type: String,
      enum: [null, 'MALE', 'FEMALE'],
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    preferredLanguage: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    gradeLevel: {
      type: String,
      default: null,
      trim: true,
    },
    // Academic (learner profile extension)
    instituteName: {
      type: String,
      default: null,
      trim: true,
    },
    subjectsOfInterest: {
      type: [String],
      default: [],
    },
    learningGoal: {
      type: String,
      default: null,
      trim: true,
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

// email already has unique: true (creates index); no duplicate schema.index needed

const User = mongoose.model('User', userSchema);

export default User;
