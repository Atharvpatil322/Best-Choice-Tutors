/**
 * Review Controller (Phase 8)
 * Submit a review for a completed booking. Learner-only; tutors and admins cannot submit.
 * Report a review: tutor-only; only the tutor who owns the review can report it.
 * List received reviews: tutor-only; reviews where tutorId is the authenticated tutor.
 */

import Tutor from '../models/Tutor.js';
import Review from '../models/Review.js';
import { submitReviewForBooking, reportReviewAsTutor, ReviewError } from '../services/reviewService.js';

/**
 * POST /api/bookings/:id/review
 * Body: { rating: number (1–5), reviewText?: string }
 * Rules: booking must exist, COMPLETED, paid; requesting user must be the learner; canReview true.
 */
export async function submitReview(req, res, next) {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can submit reviews. Tutors and admins cannot submit reviews.',
      });
    }

    const bookingId = req.params.id;
    const { rating, reviewText } = req.body;

    if (bookingId == null || bookingId === '') {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const review = await submitReviewForBooking({
      bookingId,
      learnerId: req.user._id,
      rating,
      reviewText,
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        id: review._id.toString(),
        bookingId: review.bookingId.toString(),
        tutorId: review.tutorId.toString(),
        learnerId: review.learnerId.toString(),
        rating: review.rating,
        reviewText: review.reviewText || '',
        createdAt: review.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof ReviewError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/tutor/reviews
 * Tutor only. Returns reviews received by the authenticated tutor (review.tutorId === tutor._id).
 * Read-only; includes isReported so frontend can hide Report button when already reported.
 */
export async function getMyReceivedReviews(req, res, next) {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'Access denied: Tutor role required',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    const reviews = await Review.find({ tutorId: tutor._id })
      .select('bookingId tutorId learnerId rating reviewText createdAt isReported')
      .lean()
      .sort({ createdAt: -1 });

    const items = reviews.map((r) => ({
      id: r._id.toString(),
      bookingId: r.bookingId.toString(),
      tutorId: r.tutorId.toString(),
      learnerId: r.learnerId.toString(),
      rating: r.rating,
      reviewText: r.reviewText ?? '',
      createdAt: r.createdAt,
      isReported: !!r.isReported,
    }));

    return res.status(200).json({
      count: items.length,
      reviews: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/learner/reviews
 * Learner only. Returns reviews submitted by the authenticated learner (review.learnerId === req.user._id).
 * Includes tutor name and booking date/time for context.
 */
export async function getMySubmittedReviews(req, res, next) {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Access denied: Learner role required',
      });
    }

    const reviews = await Review.find({ learnerId: req.user._id })
      .populate('tutorId', 'fullName')
      .populate('bookingId', 'date startTime endTime')
      .select('bookingId tutorId learnerId rating reviewText createdAt')
      .lean()
      .sort({ createdAt: -1 });

    const items = reviews.map((r) => ({
      id: r._id.toString(),
      bookingId: r.bookingId?._id?.toString() ?? r.bookingId?.toString() ?? null,
      tutorId: r.tutorId?._id?.toString() ?? r.tutorId?.toString() ?? null,
      tutorName: r.tutorId?.fullName ?? 'Tutor',
      bookingDate: r.bookingId?.date ?? null,
      bookingStartTime: r.bookingId?.startTime ?? null,
      bookingEndTime: r.bookingId?.endTime ?? null,
      rating: r.rating,
      reviewText: r.reviewText ?? '',
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      count: items.length,
      reviews: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tutor/reviews/:reviewId/report
 * Body: { reportedReason?: string }
 * Rules: only the tutor who owns the review (review.tutorId) can report; review must exist; can report only once.
 * Learners cannot report reviews.
 */
export async function reportReview(req, res, next) {
  try {
    if (req.user.role === 'Learner') {
      return res.status(403).json({
        message: 'Learners cannot report reviews. Only the tutor who received the review can report it.',
      });
    }

    const reviewId = req.params.reviewId;
    const reportedReason = req.body.reportedReason;

    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }

    const review = await reportReviewAsTutor(reviewId, req.user._id, reportedReason);

    return res.status(200).json({
      message: 'Review reported successfully',
      review: {
        id: review._id.toString(),
        isReported: review.isReported,
        reportedAt: review.reportedAt,
      },
    });
  } catch (err) {
    if (err instanceof ReviewError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}
