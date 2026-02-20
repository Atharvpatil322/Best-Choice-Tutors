import mongoose from 'mongoose';

/**
 * TuitionRequest Model
 * Phase 9: Reverse Discovery
 *
 * Represents a learner's tutoring need. Created only by learners.
 * No tutor, booking, or chat fields on this model.
 */

const tuitionRequestSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required'],
    },
    subject: {
      type: String,
      trim: true,
    },
    /** Array of subjects for subject-based visibility (request.subjects ∩ tutor.subjects). */
    subjects: {
      type: [String],
      default: undefined,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    mode: {
      type: String,
      enum: {
        values: ['ONLINE', 'IN_PERSON', 'EITHER'],
        message: 'Mode must be ONLINE, IN_PERSON, or EITHER',
      },
      required: [true, 'Mode is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'CLOSED'],
        message: 'Status must be ACTIVE or CLOSED',
      },
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

tuitionRequestSchema.index({ learnerId: 1 });
tuitionRequestSchema.index({ status: 1 });
tuitionRequestSchema.index({ subjects: 1 });

const TuitionRequest = mongoose.model('TuitionRequest', tuitionRequestSchema);

export default TuitionRequest;
