/**
 * Review Service (Phase 8)
 * Submit review for a completed booking. Learner-only; booking must exist, be COMPLETED, and canReview true.
 * Tutor rating aggregation: averageRating and reviewCount from Review collection (no cache/denormalize).
 */

import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Tutor from '../models/Tutor.js';
import { getCanReview } from './bookingService.js';

class ReviewError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ReviewError';
    this.statusCode = statusCode;
  }
}

/**
 * Submit a review for a booking.
 * Rules: booking must exist; status COMPLETED; payment PAID; requesting user must be the learner; canReview must be true.
 * Tutors and admins cannot submit reviews.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID (ObjectId string)
 * @param {string} params.learnerId - Requesting user ID (must be booking's learner)
 * @param {number} params.rating - Rating 1–5
 * @param {string} [params.reviewText] - Optional review text
 * @returns {Promise<Review>} Created review
 * @throws {ReviewError} 404 booking not found, 403 not learner / not eligible, 400 validation / duplicate
 */
export async function submitReviewForBooking({ bookingId, learnerId, rating, reviewText }) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    throw new ReviewError('Booking not found', 404);
  }

  if (booking.learnerId.toString() !== learnerId.toString()) {
    throw new ReviewError('You can only submit a review for your own booking', 403);
  }

  if (!getCanReview(booking)) {
    throw new ReviewError('Review is only allowed for completed, paid bookings', 403);
  }

  const review = new Review({
    bookingId,
    tutorId: booking.tutorId,
    learnerId,
    rating: Number(rating),
    reviewText: typeof reviewText === 'string' ? reviewText.trim() : '',
  });

  try {
    await review.save();
    return review;
  } catch (err) {
    if (err.code === 11000) {
      throw new ReviewError('You have already submitted a review for this booking', 400);
    }
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join('; ') || err.message;
      throw new ReviewError(message, 400);
    }
    throw err;
  }
}

/**
 * Get tutor rating aggregation from Review collection (source of truth).
 * Computes averageRating and reviewCount via aggregation; no cache or denormalization.
 *
 * @param {string} tutorId - Tutor ID (ObjectId string)
 * @returns {Promise<{ averageRating: number, reviewCount: number }>}
 */
export async function getTutorRating(tutorId) {
  const id = mongoose.Types.ObjectId.isValid(tutorId) ? new mongoose.Types.ObjectId(tutorId) : null;
  if (!id) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const result = await Review.aggregate([
    { $match: { tutorId: id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const avg = result[0].averageRating != null ? Number(result[0].averageRating) : 0;
  const count = result[0].reviewCount != null ? Number(result[0].reviewCount) : 0;

  return {
    averageRating: avg,
    reviewCount: count,
  };
}

/**
 * Report a review (tutor only). Only the tutor who owns the review (review.tutorId) can report it.
 * Review must exist and can be reported only once. Does not delete or hide the review.
 * No updates allowed after initial report (enforced in service and model).
 *
 * @param {string} reviewId - Review ID (ObjectId string)
 * @param {string} reportingUserId - Requesting user ID (must be the tutor who received the review)
 * @param {string} [reportedReason] - Optional reason text
 * @returns {Promise<Review>} Updated review
 * @throws {ReviewError} 404 review not found, 403 not the owning tutor, 400 already reported
 */
export async function reportReviewAsTutor(reviewId, reportingUserId, reportedReason) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ReviewError('Review not found', 404);
  }

  if (review.isReported) {
    throw new ReviewError('This review has already been reported', 400);
  }

  const tutor = await Tutor.findById(review.tutorId).lean();
  if (!tutor || tutor.userId.toString() !== reportingUserId.toString()) {
    throw new ReviewError('Only the tutor who received this review can report it', 403);
  }

  const reportedAt = new Date();
  const reportedReasonTrimmed = typeof reportedReason === 'string' ? reportedReason.trim() : null;

  const updated = await Review.findOneAndUpdate(
    { _id: reviewId, isReported: false },
    {
      $set: {
        isReported: true,
        reportedBy: reportingUserId,
        reportedReason: reportedReasonTrimmed,
        reportedAt,
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new ReviewError('This review has already been reported', 400);
  }

  return updated;
}

export { ReviewError };
