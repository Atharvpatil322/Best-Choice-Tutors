/**
 * Socket.IO Chat Service
 * - Chat allowed only when a valid booking exists between learner and tutor.
 * - Messages persisted in DB. No group chat; no file sharing.
 */

import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Tutor from '../models/Tutor.js';
import Message from '../models/Message.js';

const MAX_MESSAGE_LENGTH = 5000;
const ROOM_PREFIX = 'booking:';

/**
 * Check if the authenticated user is a participant of the booking (learner or tutor).
 * @param {string} userId - User _id (ObjectId string)
 * @param {string} userRole - 'Learner' | 'Tutor'
 * @param {string} bookingId - Booking _id string
 * @returns {Promise<{ allowed: boolean, booking?: Object }>}
 */
async function canAccessBooking(userId, userRole, bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return { allowed: false };

  if (userRole === 'Learner') {
    const allowed = booking.learnerId && booking.learnerId.toString() === userId;
    return { allowed: !!allowed, booking };
  }

  if (userRole === 'Tutor') {
    const tutor = await Tutor.findOne({ userId }).lean();
    if (!tutor) return { allowed: false };
    const allowed = booking.tutorId && booking.tutorId.toString() === tutor._id.toString();
    return { allowed: !!allowed, booking };
  }

  return { allowed: false };
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
      const { allowed } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        callback?.({ success: false, error: 'You do not have access to this booking' });
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
      const { allowed } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        callback?.({ success: false, error: 'You do not have access to this booking' });
        return;
      }

      try {
        const doc = await Message.create({
          bookingId,
          senderId: socket.userId,
          senderRole: socket.userRole,
          message: text,
          timestamp: new Date(),
        });
        const msgPayload = {
          id: doc._id.toString(),
          bookingId: doc.bookingId.toString(),
          senderId: doc.senderId.toString(),
          senderRole: doc.senderRole,
          message: doc.message,
          timestamp: doc.timestamp,
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
      const { allowed } = await canAccessBooking(socket.userId, socket.userRole, bookingId);
      if (!allowed) {
        callback?.({ success: false, error: 'You do not have access to this booking' });
        return;
      }
      try {
        const messages = await Message.find({ bookingId })
          .sort({ timestamp: 1 })
          .lean();
        const list = messages.map((m) => ({
          id: m._id.toString(),
          bookingId: m.bookingId.toString(),
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
