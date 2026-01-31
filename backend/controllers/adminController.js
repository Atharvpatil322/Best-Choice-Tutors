/**
 * Admin Controller
 * Read-only APIs for admin. No admin actions (e.g. moderation decisions) yet.
 */

import Review from '../models/Review.js';

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
