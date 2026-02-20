/**
 * Tutor Wallet Controller
 * Read-only wallet summary. Withdrawal deductions do not alter historical TutorEarnings rows;
 * available is computed by subtracting approved withdrawals from raw available ledger sum.
 *
 * Summary:
 * - pendingEarnings = sum(TutorEarnings where status === "pendingRelease") — unchanged
 * - availableEarnings = sum(available TutorEarnings) - sum(WithdrawalDeduction) — net withdrawable
 * - totalEarnings = pendingEarnings + availableEarnings — current balance in system (no double counting)
 * - withdrawnTotal = sum(WithdrawalRequest amountRequested where status === "PAID")
 * - hasBankDetails, canWithdraw, pendingWithdrawal
 */

import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';
import PlatformConfig from '../models/PlatformConfig.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { hasBankDetails } from '../services/tutorBankDetailsService.js';
import { getAvailableEarnings } from '../services/withdrawalService.js';

/**
 * GET /api/tutor/wallet
 * Returns totalEarnings, pendingEarnings, availableEarnings, and list of earnings entries.
 */
export const getWallet = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.json({
        totalEarnings: 0,
        pendingEarnings: 0,
        availableEarnings: 0,
        withdrawnTotal: 0,
        hasBankDetails: false,
        canWithdraw: false,
        pendingWithdrawal: null,
        entries: [],
      });
    }

    const bankDetailsPresent = await hasBankDetails(tutor._id);
    const config = await PlatformConfig.findOne().lean();
    const minWithdrawalAmount = config?.minWithdrawalAmount ?? 0;

    const entries = await TutorEarnings.find({ tutorId: tutor._id })
      .sort({ createdAt: -1 })
      .lean();

    let pendingEarnings = 0;
    for (const e of entries) {
      if (e.status === 'pendingRelease') pendingEarnings += e.amount;
    }

    const availableEarnings = await getAvailableEarnings(tutor._id);
    const totalEarnings = pendingEarnings + availableEarnings;

    const list = entries.map((e) => ({
      id: e._id.toString(),
      bookingId: e.bookingId?.toString(),
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt,
    }));

    const canWithdraw =
      bankDetailsPresent && Number.isFinite(availableEarnings) && availableEarnings >= minWithdrawalAmount;

    const [pendingWithdrawalDoc, withdrawnResult] = await Promise.all([
      WithdrawalRequest.findOne({ tutorId: tutor._id, status: 'PENDING' }).lean(),
      WithdrawalRequest.aggregate([
        { $match: { tutorId: tutor._id, status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amountRequested' } } },
      ]),
    ]);

    const withdrawnTotal = withdrawnResult[0]?.total ?? 0;

    const pendingWithdrawal = pendingWithdrawalDoc
      ? {
          id: pendingWithdrawalDoc._id.toString(),
          amountRequested: pendingWithdrawalDoc.amountRequested,
          status: pendingWithdrawalDoc.status,
          requestedAt: pendingWithdrawalDoc.requestedAt,
        }
      : null;

    res.json({
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      withdrawnTotal,
      hasBankDetails: bankDetailsPresent,
      canWithdraw,
      minWithdrawalAmount,
      pendingWithdrawal,
      entries: list,
    });
  } catch (error) {
    next(error);
  }
};
