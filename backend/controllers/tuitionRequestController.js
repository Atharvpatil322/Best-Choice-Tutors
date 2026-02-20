/**
 * Tuition Request Controller
 * Phase 9: Reverse Discovery – learner-created tuition requests
 */

import { validationResult } from 'express-validator';
import TuitionRequest from '../models/TuitionRequest.js';
import Tutor from '../models/Tutor.js';
import TutorInterest from '../models/TutorInterest.js';
import { getTutorRating } from '../services/reviewService.js';
import { presignProfilePhotoUrl } from '../services/s3Service.js';

/**
 * Create a tuition request (learners only)
 * Rules: Only Learner role can create; Tutors and Admins rejected with 403.
 * Validates: subject, budget, mode (and description per model).
 * Sets status = ACTIVE by default (model default).
 */
export const createTuitionRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can create tuition requests. Tutors and admins are not allowed.',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { subject, subjects: subjectsRaw, budget, mode, description } = req.body;

    // Normalize to subjects array (at least one)
    let subjectsArr = Array.isArray(subjectsRaw) && subjectsRaw.length > 0
      ? subjectsRaw.map((s) => (typeof s === 'string' ? s.trim() : String(s))).filter(Boolean)
      : null;
    if (!subjectsArr?.length && subject != null && String(subject).trim()) {
      subjectsArr = [String(subject).trim()];
    }
    if (!subjectsArr?.length) {
      return res.status(400).json({ message: 'At least one subject is required (subject or subjects array)' });
    }

    const request = await TuitionRequest.create({
      learnerId: req.user._id,
      subject: subjectsArr[0],
      subjects: subjectsArr,
      budget: Number(budget),
      mode,
      description: description.trim(),
    });

    res.status(201).json({
      id: request._id.toString(),
      learnerId: request.learnerId.toString(),
      subject: request.subject,
      subjects: request.subjects || [request.subject],
      budget: request.budget,
      mode: request.mode,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List active tuition requests (verified tutors only, read-only).
 * Only tutors with isVerified === true; returns only ACTIVE requests.
 * Tutors cannot see learner contact details (no learnerId, email, phone, name).
 */
export const getActiveTuitionRequestsForTutor = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(403).json({
        message: 'Tutor profile not found',
      });
    }
    if (!tutor.isVerified) {
      return res.status(403).json({
        message: 'Only verified tutors can view tuition requests. Complete verification to access.',
      });
    }

    const tutorSubjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
    if (tutorSubjects.length === 0) {
      return res.json({ requests: [] });
    }

    const requests = await TuitionRequest.find({
      status: 'ACTIVE',
      $or: [
        { subjects: { $in: tutorSubjects } },
        { subject: { $in: tutorSubjects } },
      ],
    })
      .sort({ createdAt: -1 })
      .select('subject subjects budget mode description status createdAt')
      .lean();

    const list = requests.map((r) => ({
      id: r._id.toString(),
      subject: r.subject,
      subjects: r.subjects || (r.subject ? [r.subject] : []),
      budget: r.budget,
      mode: r.mode,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({ requests: list });
  } catch (error) {
    next(error);
  }
};

/**
 * List learner's own tuition requests (learners only).
 * Returns id, subject, budget, mode, description, status, createdAt.
 */
export const listMyTuitionRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Learners',
      });
    }

    const requests = await TuitionRequest.find({ learnerId: req.user._id })
      .sort({ createdAt: -1 })
      .select('subject subjects budget mode description status createdAt')
      .lean();

    const list = requests.map((r) => ({
      id: r._id.toString(),
      subject: r.subject,
      subjects: r.subjects || (r.subject ? [r.subject] : []),
      budget: r.budget,
      mode: r.mode,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({ requests: list });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw a tuition request (learners only, must own request).
 * Sets status = CLOSED. Request becomes invisible to tutors. No hard delete.
 * Validation: request must be ACTIVE; reject if already CLOSED.
 */
export const withdrawTuitionRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'Only learners can withdraw their own tuition requests',
      });
    }

    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const tuitionRequest = await TuitionRequest.findById(requestId);
    if (!tuitionRequest) {
      return res.status(404).json({ message: 'Tuition request not found' });
    }
    if (tuitionRequest.learnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the request owner can withdraw this request',
      });
    }
    if (tuitionRequest.status !== 'ACTIVE') {
      return res.status(400).json({
        message: 'Only active requests can be withdrawn. This request is already closed.',
      });
    }

    tuitionRequest.status = 'CLOSED';
    await tuitionRequest.save();

    res.json({
      id: tuitionRequest._id.toString(),
      status: tuitionRequest.status,
      message: 'Request withdrawn successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close a tuition request (learners only, must own request).
 * Sets status = CLOSED. CLOSED requests are not returned to tutors (list uses status: 'ACTIVE').
 */
export const closeTuitionRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Learners',
      });
    }

    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const tuitionRequest = await TuitionRequest.findById(requestId);
    if (!tuitionRequest) {
      return res.status(404).json({ message: 'Tuition request not found' });
    }
    if (tuitionRequest.learnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the request owner can close this request',
      });
    }

    tuitionRequest.status = 'CLOSED';
    await tuitionRequest.save();

    res.json({
      id: tuitionRequest._id.toString(),
      status: tuitionRequest.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List interested tutors for a learner's tuition request (learners only, must own request).
 * Returns tutor profile summary: name, subjects, rating. No chat or booking creation.
 */
export const getInterestedTutorsForRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Learner') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Learners',
      });
    }

    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const tuitionRequest = await TuitionRequest.findById(requestId).lean();
    if (!tuitionRequest) {
      return res.status(404).json({ message: 'Tuition request not found' });
    }
    if (tuitionRequest.learnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only view interested tutors for your own requests',
      });
    }

    const interests = await TutorInterest.find({ requestId })
      .populate('tutorId', 'fullName subjects profilePhoto')
      .sort({ createdAt: 1 })
      .lean();

    const tutors = await Promise.all(
      interests.map(async (i) => {
        const tutor = i.tutorId;
        if (!tutor) return null;
        const { averageRating } = await getTutorRating(tutor._id);
        const profilePhoto = await presignProfilePhotoUrl(tutor.profilePhoto ?? null);
        return {
          tutorId: tutor._id.toString(),
          name: tutor.fullName,
          subjects: tutor.subjects || [],
          rating: averageRating,
          profilePhoto: profilePhoto ?? undefined,
        };
      })
    );

    res.json({
      requestId,
      tutors: tutors.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Express interest in a tuition request (verified tutors only).
 * Tutor can express interest only once per request; uniqueness enforced on (requestId, tutorId).
 * Rejects duplicate interest with 409.
 */
export const expressInterest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(403).json({
        message: 'Tutor profile not found',
      });
    }
    if (!tutor.isVerified) {
      return res.status(403).json({
        message: 'Only verified tutors can express interest. Complete verification to access.',
      });
    }

    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const request = await TuitionRequest.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({ message: 'Tuition request not found' });
    }
    if (request.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Cannot express interest in a closed or inactive request' });
    }

    const existing = await TutorInterest.findOne({
      requestId,
      tutorId: tutor._id,
    }).lean();
    if (existing) {
      return res.status(409).json({
        message: 'You have already expressed interest in this request',
      });
    }

    const interest = await TutorInterest.create({
      requestId,
      tutorId: tutor._id,
    });

    res.status(201).json({
      id: interest._id.toString(),
      requestId: interest.requestId.toString(),
      tutorId: interest.tutorId.toString(),
      createdAt: interest.createdAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already expressed interest in this request',
      });
    }
    next(error);
  }
};
