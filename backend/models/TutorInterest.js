import mongoose from 'mongoose';

/**
 * TutorInterest Model
 * Phase 9: Reverse Discovery – tutor expresses interest in a tuition request
 *
 * Links a tutor to a tuition request. No messages or chat data stored.
 */

const tutorInterestSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TuitionRequest',
      required: [true, 'Request ID is required'],
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

tutorInterestSchema.index({ requestId: 1 });
tutorInterestSchema.index({ tutorId: 1 });
tutorInterestSchema.index({ requestId: 1, tutorId: 1 }, { unique: true });

const TutorInterest = mongoose.model('TutorInterest', tutorInterestSchema);

export default TutorInterest;
