/**
 * Socket.IO Chat Service
 * - Chat allowed only when a valid booking exists between learner and tutor.
 * - All messages for a booking are stored in one Conversation document (messages array). No new document per message.
 * - No group chat; no file sharing.
 */

import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Tutor from '../models/Tutor.js';
import Conversation from '../models/Conversation.js';

const MAX_MESSAGE_LENGTH = 5000;
const ROOM_PREFIX = 'booking:';

/** Booking statuses that allow chat (confirmed / paid or equivalent final paid state). All others (PENDING, FAILED, CANCELLED, NO_SHOW, etc.) block chat. */
const CHAT_ALLOWED_BOOKING_STATUSES = ['PAID', 'COMPLETED'];

/**
 * Check if the authenticated user can access chat for the booking: booking must exist,
 * user must be a participant, and booking status must be PAID or COMPLETED.
 * PENDING, FAILED, CANCELLED, NO_SHOW, or any non-paid state → block chat.
 *
 * @param {string} userId - User _id (ObjectId string)
 * @param {string} userRole - 'Learner' | 'Tutor'
 * @param {string} bookingId - Booking _id string
 * @returns {Promise<{ allowed: boolean, booking?: Object, reason?: 'not_participant' | 'booking_not_eligible' }>}
 */
async function canAccessBooking(userId, userRole, bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return { allowed: false, reason: 'not_participant' };

  let isParticipant = false;
  if (userRole === 'Learner') {
    isParticipant = booking.learnerId && booking.learnerId.toString() === userId;
  } else if (userRole === 'Tutor') {
    const tutor = await Tutor.findOne({ userId }).lean();
    if (!tutor) return { allowed: false, reason: 'not_participant' };
    isParticipant = booking.tutorId && booking.tutorId.toString() === tutor._id.toString();
  }

  if (!isParticipant) {
    return { allowed: false, reason: 'not_participant', booking };
  }

  const statusAllowed = CHAT_ALLOWED_BOOKING_STATUSES.includes(booking.status);
  if (!statusAllowed) {
    return { allowed: false, reason: 'booking_not_eligible', booking };
  }

  return { allowed: true, booking };
}

/**
 * Attach Socket.IO to the HTTP server and configure auth + chat logic.
 * @param {import('http').Server} httpServer
 * @param {string|string[]} corsOrigin - CORS origin(s) for Socket.IO
 * @returns {Server} io
 */
export function attachSocketServer(httpServer, corsOrigin = '*') {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('No token provided'));
      }
      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }
      const user = await User.findById(decoded.userId).select('_id role').lean();
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.userId = user._id.toString();
      socket.userRole = user.role; // 'Learner' | 'Tutor' | 'Admin'
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join user's personal notification room on connection
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);

    socket.on('join_booking', async (payload, callback) => {
      const bookingId = payload?.bookingId;
      if (!bookingId) {
        callback?.({ success: false, error: 'bookingId is required' });
        return;
      }
      if (socket.userRole !== 'Learner' && socket.userRole !== 'Tutor') {
        callback?.({ success: false, error: 'Only learners and tutors can join booking chat' });
        return;
      }
      const { allowed, reason } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        const error =
          reason === 'booking_not_eligible'
            ? 'Chat is only available for confirmed, paid bookings.'
            : 'You do not have access to this booking';
        callback?.({ success: false, error });
        return;
      }
      const room = ROOM_PREFIX + bookingId;
      socket.join(room);
      callback?.({ success: true, room });
    });

    socket.on('send_message', async (payload, callback) => {
      const bookingId = payload?.bookingId;
      const text = typeof payload?.message === 'string' ? payload.message.trim() : '';
      if (!bookingId) {
        callback?.({ success: false, error: 'bookingId is required' });
        return;
      }
      if (!text) {
        callback?.({ success: false, error: 'message is required' });
        return;
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        callback?.({ success: false, error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` });
        return;
      }
      if (socket.userRole !== 'Learner' && socket.userRole !== 'Tutor') {
        callback?.({ success: false, error: 'Only learners and tutors can send messages' });
        return;
      }
      const { allowed, reason } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        const error =
          reason === 'booking_not_eligible'
            ? 'Chat is only available for confirmed, paid bookings.'
            : 'You do not have access to this booking';
        callback?.({ success: false, error });
        return;
      }

      try {
        const messageTimestamp = new Date();
        const conversation = await Conversation.findOneAndUpdate(
          { bookingId },
          {
            $push: {
              messages: {
                senderId: socket.userId,
                senderRole: socket.userRole,
                message: text,
                timestamp: messageTimestamp,
              },
            },
            $set: { lastMessageAt: messageTimestamp },
          },
          { new: true, upsert: true }
        );
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        const msgPayload = {
          id: lastMsg._id.toString(),
          bookingId: conversation.bookingId.toString(),
          senderId: lastMsg.senderId.toString(),
          senderRole: lastMsg.senderRole,
          message: lastMsg.message,
          timestamp: lastMsg.timestamp,
        };
        const room = ROOM_PREFIX + bookingId;
        io.to(room).emit('message', msgPayload);
        callback?.({ success: true, message: msgPayload });
      } catch (err) {
        callback?.({ success: false, error: err.message || 'Failed to save message' });
      }
    });

    socket.on('get_history', async (payload, callback) => {
      const bookingId = payload?.bookingId;
      if (!bookingId) {
        callback?.({ success: false, error: 'bookingId is required' });
        return;
      }
      if (socket.userRole !== 'Learner' && socket.userRole !== 'Tutor') {
        callback?.({ success: false, error: 'Only learners and tutors can get history' });
        return;
      }
      const { allowed, reason } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        const error =
          reason === 'booking_not_eligible'
            ? 'Chat is only available for confirmed, paid bookings.'
            : 'You do not have access to this booking';
        callback?.({ success: false, error });
        return;
      }
      try {
        const conversation = await Conversation.findOne({ bookingId }).lean();
        if (!conversation) {
          callback?.({ success: true, messages: [] });
          return;
        }
        const list = (conversation.messages ?? []).map((m) => ({
          id: m._id.toString(),
          bookingId: conversation.bookingId.toString(),
          senderId: m.senderId.toString(),
          senderRole: m.senderRole,
          message: m.message,
          timestamp: m.timestamp,
        }));
        callback?.({ success: true, messages: list });
      } catch (err) {
        callback?.({ success: false, error: err.message || 'Failed to load history' });
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}
