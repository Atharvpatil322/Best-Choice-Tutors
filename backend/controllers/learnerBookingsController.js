/**
 * Learner Bookings Controller
 * FR-4.1.3, UC-4.3: Learner Views Booking History
 */

import Booking from '../models/Booking.js';
import { getCanReview } from '../services/bookingService.js';

/**
 * Get learner bookings
 * FR-4.1.3: Display history of past and upcoming bookings
 * UC-4.3: Learner Views Booking History
 *
 * @returns {Promise<Array>} Array of booking objects with tutor name, date, time, status
 */
export const getBookings = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Learners',
      });
    }

    const bookings = await Booking.find({ learnerId: req.user._id })
      .populate('tutorId', 'fullName')
      .sort({ date: 1, startTime: 1 })
      .lean();

    const list = bookings.map((b) => ({
      id: b._id.toString(),
      tutorId: b.tutorId?._id?.toString(),
      tutorName: b.tutorId?.fullName ?? 'Tutor',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      canReview: getCanReview(b),
    }));

    res.json({ bookings: list });
  } catch (error) {
    next(error);
  }
};
