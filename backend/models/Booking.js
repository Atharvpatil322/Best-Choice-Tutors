import mongoose from 'mongoose';

/**
 * Booking Model
 * Phase 5.1: Booking schema & minimal booking creation API
 *
 * Represents a single booking between a learner and a tutor for a specific slot.
 * Enforces "one booking per slot" at the database level.
 */

const bookingSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required'],
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
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
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      default: 'PENDING',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    /** Agreed hourly rate for this booking (pounds). Request-based bookings use request.budget; others use tutor.hourlyRate. */
    agreedHourlyRate: {
      type: Number,
      min: [0, 'Agreed hourly rate cannot be negative'],
    },
    /** Set when booking is created from a tuition request (negotiated pricing). */
    tuitionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TuitionRequest',
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

bookingSchema.index({ learnerId: 1, date: 1, startTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index(
  { tutorId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);


const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

