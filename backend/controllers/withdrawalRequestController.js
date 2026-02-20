/**
 * Withdrawal Request Controller (tutor-only)
 * Create and list withdrawal requests. No deduction from TutorEarnings at creation.
 */

import Tutor from '../models/Tutor.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { createWithdrawalRequest } from '../services/withdrawalService.js';

/**
 * POST /api/tutor/withdrawal-requests
 * Body: { amountRequestedInPaise: number }
 * Validates: bank details, no existing PENDING, amount >= min, amount <= available.
 * Creates WithdrawalRequest with status PENDING. Does NOT modify TutorEarnings.
 */
export const createRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(404).json({
        message: 'Tutor profile not found',
      });
    }

    const amountRequestedInPaise = req.body.amountRequestedInPaise;
    if (amountRequestedInPaise == null) {
      return res.status(400).json({
        message: 'amountRequestedInPaise is required',
      });
    }

    const request = await createWithdrawalRequest({
      tutorId: tutor._id,
      amountRequestedInPaise: Number(amountRequestedInPaise),
    });

    const doc = request.toObject ? request.toObject() : request;
    res.status(201).json({
      message: 'Withdrawal request submitted. It will be processed by the team.',
      withdrawalRequest: {
        id: doc._id.toString(),
        amountRequested: doc.amountRequested,
        status: doc.status,
        requestedAt: doc.requestedAt,
        bankDetailsSnapshot: doc.bankDetailsSnapshot,
      },
    });
  } catch (error) {
    if (error.message && error.message.includes('pending withdrawal')) {
      return res.status(409).json({ message: error.message });
    }
    if (
      error.message &&
      (error.message.includes('Bank details') ||
        error.message.includes('available earnings') ||
        error.message.includes('minimum withdrawal') ||
        error.message.includes('dispute'))
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/tutor/withdrawal-requests
 * List authenticated tutor's withdrawal requests (newest first).
 */
export const getMyRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.json({ withdrawalRequests: [] });
    }

    const list = await WithdrawalRequest.find({ tutorId: tutor._id })
      .sort({ requestedAt: -1 })
      .lean();

    const withdrawalRequests = list.map((r) => ({
      id: r._id.toString(),
      amountRequested: r.amountRequested,
      status: r.status,
      requestedAt: r.requestedAt,
      processedAt: r.processedAt ?? null,
      transactionReference: r.transactionReference ?? null,
      bankDetailsSnapshot: r.bankDetailsSnapshot ?? null,
      notes: r.notes ?? null,
    }));

    res.json({ withdrawalRequests });
  } catch (error) {
    next(error);
  }
};
