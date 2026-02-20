import mongoose from 'mongoose';

/**
 * SupportTicket Model
 * Single document per ticket with embedded messages.
 *
 * Messages are appended only (no updates in-place at the schema level).
 */

const supportMessageSubSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user ID is required'],
    },
    senderRole: {
      type: String,
      enum: ['LEARNER', 'TUTOR', 'ADMIN'],
      required: [true, 'Sender role is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message must be at most 5000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
      index: true,
    },
    createdByRole: {
      type: String,
      enum: ['LEARNER', 'TUTOR'],
      required: [true, 'Created by role is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject must be at most 200 characters'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    messages: {
      type: [supportMessageSubSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Additional compound indexes for common queries can be added later if needed.

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;

