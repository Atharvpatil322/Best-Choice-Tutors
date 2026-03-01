/**
 * Tutor Wallet Controller
 * Read-only wallet summary. Available = sum of TutorEarnings where status === 'available'.
 *
 * Summary:
 * - pendingEarnings = sum(TutorEarnings where status === "pendingRelease")
 * - availableEarnings = sum(TutorEarnings where status === "available")
 * - totalEarnings = pendingEarnings + availableEarnings
 */

import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';

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
        entries: [],
      });
    }

    const entries = await TutorEarnings.find({ tutorId: tutor._id })
      .sort({ createdAt: -1 })
      .lean();

    let pendingEarnings = 0;
    let availableEarnings = 0;
    let paidOutEarnings = 0;
    for (const e of entries) {
      if (e.status === 'pendingRelease') pendingEarnings += e.amount;
      if (e.status === 'available') {
        if (e.paidAt) {
          paidOutEarnings += e.amount;
        } else {
          availableEarnings += e.amount;
        }
      }
    }
    const totalEarnings = pendingEarnings + availableEarnings;

    const list = entries.map((e) => ({
      id: e._id.toString(),
      bookingId: e.bookingId?.toString(),
      amount: e.amount,
      status: e.status,
      payoutId: e.payoutId,
      paidAt: e.paidAt,
      createdAt: e.createdAt,
    }));

    res.json({
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      paidOutEarnings,
      entries: list,
    });
  } catch (error) {
    next(error);
  }
};
