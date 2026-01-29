/**
 * Tutor Bookings Controller
 * Tutor views list of their bookings (read-only).
 */

import Booking from '../models/Booking.js';
import Tutor from '../models/Tutor.js';

/**
 * Get tutor bookings
 * Returns list of bookings for the authenticated tutor with learner name, date, time, status.
 *
 * @returns {Promise<Array>} Array of { id, learnerName, date, startTime, endTime, status }
 */
export const getBookings = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.json({ bookings: [] });
    }

    const bookings = await Booking.find({ tutorId: tutor._id })
      .populate('learnerId', 'name')
      .sort({ date: 1, startTime: 1 })
      .lean();

    const list = bookings.map((b) => ({
      id: b._id.toString(),
      learnerId: b.learnerId?._id?.toString(),
      learnerName: b.learnerId?.name ?? 'Learner',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    }));

    res.json({ bookings: list });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single tutor booking by id (for detail screen).
 * Returns learner name, email, session date/time, booking status.
 */
export const getBookingById = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      tutorId: tutor._id,
    })
      .populate('learnerId', 'name email')
      .lean();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      id: booking._id.toString(),
      learnerName: booking.learnerId?.name ?? 'Learner',
      learnerEmail: booking.learnerId?.email ?? null,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};
