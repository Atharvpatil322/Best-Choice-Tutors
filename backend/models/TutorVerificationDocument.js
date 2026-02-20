import mongoose from 'mongoose';

/**
 * TutorVerificationDocument Model
 * Stores tutor qualification/certificate files for admin verification.
 * One tutor can have multiple documents. Documents are immutable after upload.
 */

const tutorVerificationDocumentSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: {
        values: ['PDF', 'IMAGE'],
        message: 'File type must be PDF or IMAGE',
      },
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'tutor_verification_documents',
  }
);

tutorVerificationDocumentSchema.index({ tutorId: 1, uploadedAt: -1 });

// Enforce immutability: no updates or deletes after upload
tutorVerificationDocumentSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    next(new Error('TutorVerificationDocument is immutable: updates and deletes are not allowed'));
  }
);

tutorVerificationDocumentSchema.set('versionKey', false);

const TutorVerificationDocument = mongoose.model(
  'TutorVerificationDocument',
  tutorVerificationDocumentSchema
);

export default TutorVerificationDocument;
