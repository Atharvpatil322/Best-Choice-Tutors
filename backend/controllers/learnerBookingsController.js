/**
 * Learner Bookings Controller
 * FR-4.1.3, UC-4.3: Learner Views Booking History
 */

import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import { getCanReview } from '../services/bookingService.js';
import { presignProfilePhotoUrl } from '../services/s3Service.js';
import mongoose from 'mongoose';
/**
 * Get learner bookings
 * FR-4.1.3: Display history of past and upcoming bookings
 * UC-4.3: Learner Views Booking History
 *
 * @returns {Promise<Array>} Array of booking objects with tutor name, date, time, status
 */
export const getBookings = async (req, res, next) => {
  try {
    console.time('TOTAL-REQUEST');
    
    console.time('DB-PING');
    await mongoose.connection.db.admin().ping();
    console.timeEnd('DB-PING');
    
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Learners',
      });
    }

    // Filter strictly by logged-in learner's user id (do not use tutorId or requestId)
    const learnerId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? new mongoose.Types.ObjectId(req.user._id)
      : req.user._id;

    console.time('1-bookings-query');
    const bookings = await Booking.find({ learnerId })
      .populate('tutorId', 'fullName profilePhoto')
      .sort({ date: 1, startTime: 1 })
      .lean();
    console.timeEnd('1-bookings-query');
    console.log('📊 Bookings found:', bookings.length);

    const bookingIds = bookings.map((b) => b._id);

    const convos = await Conversation.find({ bookingId: { $in: bookingIds } })
      .select('bookingId lastMessageAt')
      .lean();
    const lastMessageAtByBookingId = new Map(
      convos.map((c) => [c.bookingId.toString(), c.lastMessageAt])
    );

    console.time('3-data-processing');
    const list = await Promise.all(
      bookings.map(async (b) => {
        const durationHours =
          b.startTime && b.endTime
            ? (() => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                return (eh * 60 + em - (sh * 60 + sm)) / 60;
              })()
            : 0;
        const rate = b.agreedHourlyRate != null ? Number(b.agreedHourlyRate) : null;
        const totalAmount =
          rate != null && durationHours > 0 ? Math.round(rate * durationHours * 100) / 100 : null;
        const tutorProfilePhoto = await presignProfilePhotoUrl(b.tutorId?.profilePhoto ?? null);

        return {
          id: b._id.toString(),
          tutorId: b.tutorId?._id?.toString(),
          tutorName: b.tutorId?.fullName ?? 'Tutor',
          tutorProfilePhoto: tutorProfilePhoto ?? undefined,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          agreedHourlyRate: rate ?? undefined,
          totalAmount: totalAmount ?? undefined,
          canReview: getCanReview(b),
          lastMessageAt: lastMessageAtByBookingId.get(b._id.toString()) ?? null,
        };
      })
    );
    console.timeEnd('3-data-processing');

    console.timeEnd('TOTAL-REQUEST');
    
    res.json({ bookings: list });
  } catch (error) {
    next(error);
  }
};