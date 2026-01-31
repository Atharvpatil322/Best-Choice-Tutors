/**
 * Learner Bookings Controller
 * FR-4.1.3, UC-4.3: Learner Views Booking History
 */

import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import { getCanReview } from '../services/bookingService.js';

/**
 * Get learner bookings
 * FR-4.1.3: Display history of past and upcoming bookings
 * UC-4.3: Learner Views Booking History
 * Phase 10: Includes hasDispute for COMPLETED bookings
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

    const bookingIds = bookings.map((b) => b._id);
    const disputes = await Dispute.find({ bookingId: { $in: bookingIds } })
      .select('bookingId status learnerEvidence')
      .lean();
    const disputeByBookingId = new Map(disputes.map((d) => [d.bookingId.toString(), d]));

    const list = bookings.map((b) => {
      const dispute = disputeByBookingId.get(b._id.toString());
      const hasDispute = !!dispute;
      const disputeStatus = dispute?.status ?? null;
      const learnerEvidenceSubmitted = hasDispute && !!dispute?.learnerEvidence?.trim();
      return {
        id: b._id.toString(),
        tutorId: b.tutorId?._id?.toString(),
        tutorName: b.tutorId?.fullName ?? 'Tutor',
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        canReview: getCanReview(b),
        hasDispute,
        disputeStatus,
        learnerEvidenceSubmitted,
      };
    });

    res.json({ bookings: list });
  } catch (error) {
    next(error);
  }
};
