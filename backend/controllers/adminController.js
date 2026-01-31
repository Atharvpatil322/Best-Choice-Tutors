/**
 * Admin Controller
 * Read-only APIs and admin actions (e.g. dispute resolution).
 */

import Review from '../models/Review.js';
import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import TutorEarnings from '../models/TutorEarnings.js';
import { resolveDispute, DisputeError } from '../services/disputeService.js';

/**
 * GET /api/admin/reported-reviews
 * Admin only. Returns reviews where isReported === true.
 * Includes: rating, reviewText, tutor (name + id), learner (name + id), bookingId, reportedReason, reportedAt.
 */
export async function getReportedReviews(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const reviews = await Review.find({ isReported: true })
      .select(
        'bookingId tutorId learnerId rating reviewText createdAt reportedReason reportedAt'
      )
      .populate('tutorId', 'fullName')
      .populate('learnerId', 'name')
      .lean()
      .sort({ reportedAt: -1 });

    const items = reviews.map((r) => ({
      id: r._id.toString(),
      bookingId: r.bookingId.toString(),
      tutorId: r.tutorId?._id?.toString() ?? r.tutorId?.toString() ?? null,
      tutorName: r.tutorId?.fullName ?? '—',
      learnerId: r.learnerId?._id?.toString() ?? r.learnerId?.toString() ?? null,
      learnerName: r.learnerId?.name ?? '—',
      rating: r.rating,
      reviewText: r.reviewText ?? '',
      createdAt: r.createdAt,
      reportedReason: r.reportedReason ?? null,
      reportedAt: r.reportedAt ?? null,
    }));

    return res.status(200).json({
      count: items.length,
      reportedReviews: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/disputes
 * Admin only. Returns list of disputes (OPEN first, then RESOLVED).
 */
export async function getDisputes(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const disputes = await Dispute.find({})
      .populate('bookingId', 'date startTime endTime status')
      .populate('learnerId', 'name email')
      .populate('tutorId', 'fullName')
      .sort({ status: 1, createdAt: -1 })
      .lean();

    const items = disputes.map((d) => ({
      id: d._id.toString(),
      bookingId: d.bookingId?._id?.toString() ?? d.bookingId?.toString() ?? null,
      date: d.bookingId?.date ?? null,
      startTime: d.bookingId?.startTime ?? null,
      endTime: d.bookingId?.endTime ?? null,
      learnerName: d.learnerId?.name ?? '—',
      tutorName: d.tutorId?.fullName ?? '—',
      status: d.status,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({ disputes: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/disputes/:disputeId
 * Admin only. Returns full dispute detail for review and resolution.
 */
export async function getDisputeById(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const dispute = await Dispute.findById(req.params.disputeId)
      .populate('bookingId')
      .populate('learnerId', 'name email')
      .populate('tutorId', 'fullName')
      .lean();

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const bookingId = dispute.bookingId?._id ?? dispute.bookingId;
    const walletEntry = await TutorEarnings.findOne({ bookingId }).lean();
    const amountInPaise = walletEntry?.amount ?? null;

    const booking = dispute.bookingId;
    return res.status(200).json({
      id: dispute._id.toString(),
      bookingId: booking?._id?.toString() ?? null,
      status: dispute.status,
      learnerEvidence: dispute.learnerEvidence ?? null,
      tutorEvidence: dispute.tutorEvidence ?? null,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt ?? null,
      outcome: dispute.outcome ?? null,
      refundAmountInPaise: dispute.refundAmountInPaise ?? null,
      booking: booking
        ? {
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            learnerName: dispute.learnerId?.name ?? '—',
            learnerEmail: dispute.learnerId?.email ?? null,
            tutorName: dispute.tutorId?.fullName ?? '—',
          }
        : null,
      amountInPaise,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/disputes/:disputeId/resolve
 * Admin only. Resolve a dispute. Decision is final.
 * Body: { outcome: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RELEASE_PAYMENT_TO_TUTOR', refundAmountInPaise?: number }
 */
export async function resolveDisputeHandler(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const { disputeId } = req.params;
    const { outcome, refundAmountInPaise } = req.body ?? {};

    const dispute = await resolveDispute({
      disputeId,
      outcome,
      refundAmountInPaise,
      adminId: req.user._id.toString(),
    });

    return res.status(200).json({
      message: 'Dispute resolved successfully',
      dispute: {
        id: dispute._id.toString(),
        bookingId: dispute.bookingId.toString(),
        status: dispute.status,
        outcome: dispute.outcome,
        refundAmountInPaise: dispute.refundAmountInPaise ?? null,
        resolvedAt: dispute.resolvedAt,
      },
    });
  } catch (err) {
    if (err instanceof DisputeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}
