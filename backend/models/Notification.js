import mongoose from 'mongoose';

/**
 * In-app notifications (e.g. booking rescheduled, admin broadcast).
 * Fetched via API; no socket. TTL index auto-deletes documents after expiry.
 */
const NOTIFICATION_TTL_DAYS = 30;
const TTL_SECONDS = NOTIFICATION_TTL_DAYS * 24 * 60 * 60;

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['booking_rescheduled', 'admin_broadcast'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL: MongoDB automatically deletes documents when createdAt is older than TTL_SECONDS
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
