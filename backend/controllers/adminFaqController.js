/**
 * Admin FAQ Controller
 * CRUD operations for FAQ management (admin only).
 */

import FAQ from "../models/FAQ.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import mongoose from "mongoose";

/**
 * POST /api/admin/faq
 * Admin only. Create a new FAQ entry.
 * Body: { question, answer, link?, order?, isActive? }
 */
export async function createFaq(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { question, answer, link, order, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }

    const faqData = {
      question: question.trim(),
      answer: answer.trim(),
      link: link ? link.trim() : null,
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      createdBy: req.user._id,
    };

    const faq = await FAQ.create(faqData);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "FAQ_CREATED",
      entityType: "FAQ",
      entityId: faq._id,
      metadata: { question: faq.question },
    });

    return res.status(201).json({ message: "FAQ created successfully", faq });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/faq
 * Admin only. List all FAQs (including inactive).
 * Query params: page, limit, isActive
 */
export async function getAllFaqs(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { isActive } = req.query;

    const filter = {};
    if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;

    const [faqs, totalCount] = await Promise.all([
      FAQ.find(filter)
        .select("question answer link order isActive createdAt updatedAt")
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FAQ.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      faqs,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/faq/:id
 * Admin only. Get a single FAQ by ID.
 */
export async function getFaqById(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid FAQ ID" });
    }

    const faq = await FAQ.findById(id).lean();
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    return res.status(200).json({ faq });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/faq/:id
 * Admin only. Update a FAQ entry.
 */
export async function updateFaq(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid FAQ ID" });
    }

    const existing = await FAQ.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    const { question, answer, link, order, isActive } = req.body;
    const updateData = { updatedBy: req.user._id };

    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (link !== undefined) updateData.link = link ? link.trim() : null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const faq = await FAQ.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "FAQ_UPDATED",
      entityType: "FAQ",
      entityId: faq._id,
      metadata: { question: faq.question, isActive: faq.isActive },
    });

    return res.status(200).json({ message: "FAQ updated successfully", faq });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/faq/:id
 * Admin only. Delete a FAQ entry.
 */
export async function deleteFaq(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid FAQ ID" });
    }

    const faq = await FAQ.findByIdAndDelete(id).lean();
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "FAQ_DELETED",
      entityType: "FAQ",
      entityId: faq._id,
      metadata: { question: faq.question },
    });

    return res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (err) {
    next(err);
  }
}
