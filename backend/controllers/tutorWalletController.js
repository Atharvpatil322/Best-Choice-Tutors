/**
 * Tutor Wallet Controller
 * Read-only wallet summary.
 *
 * Summary:
 * - pendingEarnings = net sum where status === "pendingRelease"
 * - availableEarnings = live Stripe connected account total balance
 * - paidOutEarnings = sum of Stripe payout.paid events for this tutor
 * - totalEarnings = lifetime transferred to Stripe (from transfer IDs in earnings ledger)
 */

import Tutor from '../models/Tutor.js';
import TutorEarnings from '../models/TutorEarnings.js';
import TutorPayout from '../models/TutorPayout.js';
import { retrieveConnectedAccountBalance, retrieveTransfer } from '../services/stripeService.js';

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

    const transferIds = Array.from(
      new Set(
        entries
          .map((e) => e.stripeTransferId)
          .filter((id) => typeof id === 'string' && id.trim())
      )
    );

    const transferAmountMap = new Map();
    await Promise.all(
      transferIds.map(async (transferId) => {
        try {
          const tr = await retrieveTransfer(transferId);
          if (Number.isFinite(Number(tr?.amount))) {
            transferAmountMap.set(transferId, Number(tr.amount));
          }
        } catch (err) {
          console.warn('Wallet: failed to retrieve Stripe transfer amount', {
            transferId,
            message: err?.message,
          });
        }
      })
    );

    const getNetAmount = (entry) => {
      if (entry?.stripeTransferId && transferAmountMap.has(entry.stripeTransferId)) {
        return transferAmountMap.get(entry.stripeTransferId);
      }
      const gross = Number(entry.amount) || 0;
      const commission = Number(entry.commissionInPaise) || 0;
      return Math.max(0, gross - commission);
    };

    let pendingEarnings = 0;
    let platformAvailableEarnings = 0;
    let inStripeBalanceEarnings = 0;
    let paidOutEarnings = 0;
    let lifetimeTransferredEarnings = 0;
    for (const e of entries) {
      const net = getNetAmount(e);
      if (e.status === 'pendingRelease') pendingEarnings += net;
      if (e.status === 'available') {
        if (e.stripeTransferId) {
          inStripeBalanceEarnings += net;
        } else {
          platformAvailableEarnings += net;
        }
        if (e.stripeTransferId) {
          lifetimeTransferredEarnings += net;
        }
      }
    }
    // Tutor-facing "Available earnings" should align to live Stripe connected account total balance.
    let availableEarnings = inStripeBalanceEarnings;
    if (tutor.stripeAccountId) {
      try {
        const balance = await retrieveConnectedAccountBalance(tutor.stripeAccountId);
        const available = Array.isArray(balance?.available) ? balance.available : [];
        const pending = Array.isArray(balance?.pending) ? balance.pending : [];
        const all = [...available, ...pending];

        const gbpEntries = all.filter((b) => String(b.currency || '').toLowerCase() === 'gbp');
        const source = gbpEntries.length > 0 ? gbpEntries : all;
        const stripeTotal = source.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        if (Number.isFinite(stripeTotal) && stripeTotal >= 0) {
          availableEarnings = stripeTotal;
        }
      } catch (err) {
        console.warn('Wallet: failed to fetch Stripe connected account balance, using ledger fallback', {
          tutorId: tutor._id?.toString?.(),
          message: err?.message,
        });
      }
    }
    // Tutor-facing "Total earnings" reflects lifetime amount transferred to Stripe for this tutor.
    const totalEarnings = lifetimeTransferredEarnings;
    const payouts = await TutorPayout.find({ tutorId: tutor._id }).lean();
    paidOutEarnings = payouts
      .filter((p) => String(p.currency || 'gbp').toLowerCase() === 'gbp')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const list = entries.map((e) => {
      const grossAmount = Number(e.amount) || 0;
      const commissionInPaise = Number(e.commissionInPaise) || 0;
      const netAmount = getNetAmount(e);
      return {
        id: e._id.toString(),
        bookingId: e.bookingId?.toString(),
        amount: netAmount, // Backward compatible key used by existing frontend
        grossAmount,
        commissionInPaise,
        netAmount,
        status: e.status,
        stripeTransferId: e.stripeTransferId,
        payoutId: e.payoutId,
        paidAt: e.paidAt,
        createdAt: e.createdAt,
      };
    });

    res.json({
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      paidOutEarnings,
      // Keep for troubleshooting/ops; UI can ignore these.
      platformAvailableEarnings,
      inStripeBalanceEarnings,
      entries: list,
    });
  } catch (error) {
    next(error);
  }
};
