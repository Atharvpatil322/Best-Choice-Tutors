/**
 * Admin Withdrawal Review
 * List PENDING withdrawal requests with tutor details, available balance, bank snapshot, history.
 * Approve (deduct via WithdrawalDeduction, audit) or Reject (audit only).
 */

import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Tutor from '../models/Tutor.js';
import User from '../models/User.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import {
  getAvailableEarnings,
  approveWithdrawalRequest as approveWithdrawalRequestService,
  rejectWithdrawalRequest as rejectWithdrawalRequestService,
  markWithdrawalPaid as markWithdrawalPaidService,
} from '../services/withdrawalService.js';

/**
 * GET /api/admin/withdrawal-requests?status=PENDING
 * Admin only. List withdrawal requests (default PENDING). Each item includes tutor details,
 * available balance, requested amount, bank details (masked), and that tutor's request history.
 */
export async function getWithdrawalRequests(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const status = req.query.status || 'PENDING';
    if (!['PENDING', 'APPROVED', 'REJECTED', 'PAID'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const requests = await WithdrawalRequest.find({ status })
      .populate('tutorId', 'fullName userId')
      .sort({ requestedAt: 1 })
      .lean();

    const tutorIds = [...new Set(requests.map((r) => r.tutorId?._id || r.tutorId).filter(Boolean))];

    const [availableMap, historyMap] = await Promise.all([
      (async () => {
        const map = {};
        for (const tid of tutorIds) {
          map[tid.toString()] = await getAvailableEarnings(tid);
        }
        return map;
      })(),
      (async () => {
        const allForTutors = await WithdrawalRequest.find({ tutorId: { $in: tutorIds } })
          .sort({ requestedAt: -1 })
          .lean();
        const byTutor = {};
        for (const r of allForTutors) {
          const key = r.tutorId.toString();
          if (!byTutor[key]) byTutor[key] = [];
          byTutor[key].push({
            id: r._id.toString(),
            amountRequested: r.amountRequested,
            status: r.status,
            requestedAt: r.requestedAt,
            processedAt: r.processedAt ?? null,
          });
        }
        return byTutor;
      })(),
    ]);

    const userIds = [...new Set(requests.map((r) => r.tutorId?.userId || r.tutorId?.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id email name')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const items = requests.map((r) => {
      const tutor = r.tutorId;
      const tutorIdStr = (tutor?._id || r.tutorId)?.toString();
      const userIdStr = tutor?.userId?.toString?.() || tutor?.userId;
      const user = userIdStr ? userMap[userIdStr] : null;

      return {
        id: r._id.toString(),
        tutorId: tutorIdStr,
        tutor: {
          fullName: tutor?.fullName ?? null,
          email: user?.email ?? null,
          name: user?.name ?? null,
        },
        availableBalancePaise: tutorIdStr ? availableMap[tutorIdStr] ?? 0 : 0,
        amountRequested: r.amountRequested,
        status: r.status,
        requestedAt: r.requestedAt,
        bankDetailsSnapshot: r.bankDetailsSnapshot ?? null,
        requestHistory: tutorIdStr ? historyMap[tutorIdStr] ?? [] : [],
      };
    });

    return res.status(200).json({
      status,
      withdrawalRequests: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/withdrawal-requests/:id/approve
 * Admin only. Approve: set APPROVED, create WithdrawalDeduction, audit log. No TutorEarnings rows deleted.
 */
export async function approveWithdrawalRequest(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const { id } = req.params;
    const adminId = req.user._id;

    const request = await approveWithdrawalRequestService({
      withdrawalRequestId: id,
      adminId,
    });

    await AdminAuditLog.create({
      adminId,
      tutorId: request.tutorId,
      action: 'WITHDRAWAL_APPROVED',
      entityType: 'WithdrawalRequest',
      entityId: request._id,
      metadata: {
        amountRequested: request.amountRequested,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      message: 'Withdrawal request approved. Deduction recorded.',
      withdrawalRequest: {
        id: request._id.toString(),
        status: request.status,
        processedAt: request.processedAt,
      },
    });
  } catch (err) {
    if (err.message === 'Withdrawal request not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message && err.message.includes('not PENDING')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * PATCH /api/admin/withdrawal-requests/:id/reject
 * Admin only. Reject: set REJECTED, audit log. No deduction.
 */
export async function rejectWithdrawalRequest(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const { id } = req.params;
    const adminId = req.user._id;

    const request = await rejectWithdrawalRequestService({
      withdrawalRequestId: id,
      adminId,
    });

    await AdminAuditLog.create({
      adminId,
      tutorId: request.tutorId,
      action: 'WITHDRAWAL_REJECTED',
      entityType: 'WithdrawalRequest',
      entityId: request._id,
      metadata: {
        amountRequested: request.amountRequested,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      message: 'Withdrawal request rejected.',
      withdrawalRequest: {
        id: request._id.toString(),
        status: request.status,
        processedAt: request.processedAt,
      },
    });
  } catch (err) {
    if (err.message === 'Withdrawal request not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message && err.message.includes('not PENDING')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * PATCH /api/admin/withdrawal-requests/:id/paid
 * Admin only. Mark as PAID after manual transfer. Saves transactionReference and processedAt. Audit log. No booking or TutorEarnings changes.
 */
export async function markWithdrawalPaid(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Access denied: Admin role required',
      });
    }

    const { id } = req.params;
    const adminId = req.user._id;
    const transactionReference = req.body?.transactionReference;

    const request = await markWithdrawalPaidService({
      withdrawalRequestId: id,
      adminId,
      transactionReference,
    });

    await AdminAuditLog.create({
      adminId,
      tutorId: request.tutorId,
      action: 'WITHDRAWAL_PAID',
      entityType: 'WithdrawalRequest',
      entityId: request._id,
      metadata: {
        amountRequested: request.amountRequested,
        transactionReference: request.transactionReference ?? null,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      message: 'Withdrawal marked as PAID.',
      withdrawalRequest: {
        id: request._id.toString(),
        status: request.status,
        processedAt: request.processedAt,
        transactionReference: request.transactionReference ?? null,
      },
    });
  } catch (err) {
    if (err.message === 'Withdrawal request not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message && err.message.includes('must be APPROVED')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}
