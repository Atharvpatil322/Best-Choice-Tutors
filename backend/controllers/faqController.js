/**
 * FAQ Controller (Public)
 * Read-only endpoint for active FAQs.
 */

import FAQ from "../models/FAQ.js";

/**
 * GET /api/faq
 * Public. List all active FAQs ordered by `order` ascending.
 */
export async function getActiveFaqs(req, res, next) {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .select("question answer order")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ faqs });
  } catch (err) {
    next(err);
  }
}

