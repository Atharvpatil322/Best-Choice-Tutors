/**
 * Dispute Controller
 * Phase 10: Dispute Resolution
 *
 * Learner-initiated dispute creation. Eligibility validated by disputeService.
 * Evidence submission by learner and tutor (OPEN disputes only).
 */

import Tutor from '../models/Tutor.js';
import {
  initiateDispute,
  submitLearnerEvidence,
  submitTutorEvidence,
  DisputeError,
} from '../services/disputeService.js';

/**
 * POST /api/learner/bookings/:bookingId/dispute
 * Learner only. Initiates a dispute for a completed booking.
 * Validates: learner is booking owner, booking is COMPLETED, within 24h of session end.
 */
export const createDispute = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can initiate disputes',
      });
    }

    const { bookingId } = req.params;
    const { reason } = req.body ?? {};
    const dispute = await initiateDispute({
      bookingId,
      learnerId: req.user._id.toString(),
      reason: typeof reason === 'string' ? reason : undefined,
    });

    return res.status(201).json({
      message: 'Dispute raised successfully',
      dispute: {
        id: dispute._id.toString(),
        bookingId: dispute.bookingId.toString(),
        status: dispute.status,
        createdAt: dispute.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof DisputeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * PATCH /api/learner/bookings/:bookingId/dispute/evidence
 * Learner only. Submits learner evidence. Allowed only while dispute status is OPEN.
 */
export const submitLearnerEvidenceHandler = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can submit learner evidence',
      });
    }

    const { bookingId } = req.params;
    const { learnerEvidence } = req.body ?? {};
    const dispute = await submitLearnerEvidence({
      bookingId,
      learnerId: req.user._id.toString(),
      learnerEvidence: typeof learnerEvidence === 'string' ? learnerEvidence : '',
    });

    return res.status(200).json({
      message: 'Evidence submitted successfully',
      dispute: {
        id: dispute._id.toString(),
        bookingId: dispute.bookingId.toString(),
        status: dispute.status,
        learnerEvidence: dispute.learnerEvidence ?? null,
      },
    });
  } catch (err) {
    if (err instanceof DisputeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

/**
 * PATCH /api/tutor/bookings/:bookingId/dispute/evidence
 * Tutor only. Submits tutor evidence. Allowed only while dispute status is OPEN.
 */
export const submitTutorEvidenceHandler = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'Only tutors can submit tutor evidence',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id });
    if (!tutor) {
      return res.status(403).json({ message: 'Tutor profile not found' });
    }

    const { bookingId } = req.params;
    const { tutorEvidence } = req.body ?? {};
    const dispute = await submitTutorEvidence({
      bookingId,
      tutorId: tutor._id.toString(),
      tutorEvidence: typeof tutorEvidence === 'string' ? tutorEvidence : '',
      actorId: req.user._id.toString(),
    });

    return res.status(200).json({
      message: 'Evidence submitted successfully',
      dispute: {
        id: dispute._id.toString(),
        bookingId: dispute.bookingId.toString(),
        status: dispute.status,
        tutorEvidence: dispute.tutorEvidence ?? null,
      },
    });
  } catch (err) {
    if (err instanceof DisputeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};
