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

    const bookingIds = entries
      .map((entry) => entry.bookingId)
      .filter(Boolean);
    const bookingDocs = await TutorEarnings.db
      .model('Booking')
      .find({ _id: { $in: bookingIds } })
      .select('paymentSplitMode')
      .lean();
    const bookingSplitMap = new Map(
      bookingDocs.map((b) => [b._id.toString(), b.paymentSplitMode])
    );

    let pendingEarnings = 0;
    let availableEarnings = 0;
    let paidOutEarnings = 0;
    for (const e of entries) {
      const netAmount = Math.max(0, e.amount - (e.commissionInPaise || 0));
      if (e.paidAt) {
        paidOutEarnings += netAmount;
        continue;
      }
      if (e.status === 'pendingRelease') pendingEarnings += netAmount;
      if (e.status === 'available') {
        availableEarnings += netAmount;
      }
    }
    const totalEarnings = pendingEarnings + availableEarnings;

    const list = entries.map((e) => ({
      id: e._id.toString(),
      bookingId: e.bookingId?.toString(),
      amount: Math.max(0, e.amount - (e.commissionInPaise || 0)),
      status: e.status,
      payoutId: e.payoutId,
      paidAt: e.paidAt,
      createdAt: e.createdAt,
      paymentSplitMode: e.bookingId
        ? bookingSplitMap.get(e.bookingId.toString()) || 'PLATFORM_ONLY'
        : 'PLATFORM_ONLY',
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
