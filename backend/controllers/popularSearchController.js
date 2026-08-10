/**
 * PopularSearch Controller (Public)
 * Read-only endpoint for active popular searches.
 */

import PopularSearch from "../models/PopularSearch.js";
import { ensureDefaultPopularSearches } from "../services/landingContentService.js";

/**
 * GET /api/popular-searches
 * Public. List all active popular searches ordered by `order` ascending.
 */
export async function getActivePopularSearches(req, res, next) {
  try {
    await ensureDefaultPopularSearches();

    const searches = await PopularSearch.find({ isActive: true })
      .select("label query order")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ popularSearches: searches });
  } catch (err) {
    next(err);
  }
}
