/**
 * Benefit Controller (Public)
 * Read-only endpoint for active benefits.
 */

import Benefit from "../models/Benefit.js";
import { ensureDefaultBenefits } from "../services/landingContentService.js";

/**
 * GET /api/benefits
 * Public. List all active benefits ordered by `order` ascending.
 */
export async function getActiveBenefits(req, res, next) {
  try {
    await ensureDefaultBenefits();

    const benefits = await Benefit.find({ isActive: true })
      .select("title description icon order")
      .sort({ order: 1, createdAt: -1 })
      .limit(Benefit.MAX_ACTIVE || 6)
      .lean();

    return res.status(200).json({ benefits });
  } catch (err) {
    next(err);
  }
}
