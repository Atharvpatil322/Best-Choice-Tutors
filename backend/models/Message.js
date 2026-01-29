import mongoose from 'mongoose';

/**
 * Message Model
 * Chat messages for a booking. Only participants (learner & tutor) can send/receive.
 * No group chat; no file sharing.
 */

const messageSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['Learner', 'Tutor'],
      required: [true, 'Sender role is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message must be at most 5000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

messageSchema.index({ bookingId: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
