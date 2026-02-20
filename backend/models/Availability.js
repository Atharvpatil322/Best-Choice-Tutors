import mongoose from 'mongoose';

/**
 * Availability Model
 * Phase 4.1: Tutor availability model
 * 
 * Stores tutor availability with weekly rules and exceptions
 */

const weeklyRuleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'Day of week must be between 0 and 6'],
      max: [6, 'Day of week must be between 0 and 6'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
    },
  },
  { _id: false }
);

const exceptionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
    },
    type: {
      type: String,
      enum: ['unavailable', 'override'],
      required: [true, 'Exception type is required'],
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
      unique: true,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      trim: true,
    },
    weeklyRules: {
      type: [weeklyRuleSchema],
      default: [],
      validate: {
        validator: function (rules) {
          // Check for duplicate dayOfWeek values
          const days = rules.map(r => r.dayOfWeek);
          return new Set(days).size === days.length;
        },
        message: 'Duplicate day of week found in weekly rules',
      },
    },
    exceptions: {
      type: [exceptionSchema],
      default: [],
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// tutorId has unique: true (creates index)

// Pre-save validation for time ranges
availabilitySchema.pre('save', function (next) {
  // Validate weekly rules time ranges
  for (const rule of this.weeklyRules) {
    if (rule.startTime >= rule.endTime) {
      return next(new Error(`Invalid time range for day ${rule.dayOfWeek}: start time must be before end time`));
    }
  }

  // Validate exceptions time ranges
  for (const exception of this.exceptions) {
    if (exception.startTime >= exception.endTime) {
      return next(new Error(`Invalid time range for exception on ${exception.date}: start time must be before end time`));
    }
  }

  next();
});

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
