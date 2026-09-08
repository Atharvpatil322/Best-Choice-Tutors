/**
 * FAQ Controller (Public)
 * Read-only endpoint for active FAQs.
 */

import FAQ from "../models/FAQ.js";
import { normalizeSubject } from "../constants/subjects.js";

const PUBLIC_FIELDS = "question answer link order subject";
const PUBLIC_SORT = { order: 1, createdAt: -1 };

/**
 * GET /api/faq
 * Public. List active FAQs ordered by `order` ascending.
 *
 * Query: subject - optional canonical subject, e.g. "English".
 *
 * The two sets never mix. Without a subject only the general entries are
 * returned, which is what the home page and the unfiltered tutor search show.
 * With a subject only that subject's own entries are returned - and an empty
 * list when it has none, so the caller hides the section rather than falling
 * back to general answers that were not written for that subject.
 */
export async function getActiveFaqs(req, res, next) {
  try {
    const result = normalizeSubject(req.query.subject);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }
    const subject = result.subject;

    const faqs = await FAQ.find({ isActive: true, subject })
      .select(PUBLIC_FIELDS)
      .sort(PUBLIC_SORT)
      .lean();

    return res.status(200).json({ faqs, subject });
  } catch (err) {
    next(err);
  }
}
