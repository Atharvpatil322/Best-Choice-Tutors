/**
 * Admin Benefit Controller
 * CRUD operations for "Why Choose Us" benefit management (admin only).
 */

import Benefit from "../models/Benefit.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import mongoose from "mongoose";
import { ensureDefaultBenefits } from "../services/landingContentService.js";

const MAX_ACTIVE = Benefit.MAX_ACTIVE || 6;

/**
 * POST /api/admin/benefits
 * Admin only. Create a new benefit.
 * Body: { title, description, icon?, order?, isActive? }
 */
export async function createBenefit(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { title, description, icon, order, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const active = typeof isActive === "boolean" ? isActive : true;
    if (active) {
      const activeCount = await Benefit.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE) {
        return res.status(400).json({
          message: `Maximum of ${MAX_ACTIVE} active benefits allowed`,
        });
      }
    }

    const benefitData = {
      title: title.trim(),
      description: description.trim(),
      icon: icon ? icon.trim() : "BadgeCheck",
      order: typeof order === "number" ? order : 0,
      isActive: active,
      createdBy: req.user._id,
    };

    const benefit = await Benefit.create(benefitData);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "BENEFIT_CREATED",
      entityType: "Benefit",
      entityId: benefit._id,
      metadata: { title: benefit.title },
    });

    return res.status(201).json({ message: "Benefit created successfully", benefit });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/benefits
 * Admin only. List all benefits (including inactive).
 * Query params: page, limit, isActive
 */
export async function getAllBenefits(req, res, next) {
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

    await ensureDefaultBenefits();

    const [benefits, totalCount] = await Promise.all([
      Benefit.find(filter)
        .select("title description icon order isActive createdAt updatedAt")
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Benefit.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      benefits,
      maxActive: MAX_ACTIVE,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/benefits/:id
 * Admin only. Get a single benefit by ID.
 */
export async function getBenefitById(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid benefit ID" });
    }

    const benefit = await Benefit.findById(id).lean();
    if (!benefit) {
      return res.status(404).json({ message: "Benefit not found" });
    }

    return res.status(200).json({ benefit });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/benefits/:id
 * Admin only. Update a benefit.
 */
export async function updateBenefit(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid benefit ID" });
    }

    const existing = await Benefit.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Benefit not found" });
    }

    const { title, description, icon, order, isActive } = req.body;
    const updateData = { updatedBy: req.user._id };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon.trim();
    if (order !== undefined) updateData.order = order;

    let newActive = existing.isActive;
    if (isActive !== undefined) newActive = isActive;

    // Enforce max active limit when activating
    if (newActive === true && existing.isActive !== true) {
      const activeCount = await Benefit.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE) {
        return res.status(400).json({
          message: `Maximum of ${MAX_ACTIVE} active benefits allowed`,
        });
      }
    }
    if (isActive !== undefined) updateData.isActive = newActive;

    const benefit = await Benefit.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "BENEFIT_UPDATED",
      entityType: "Benefit",
      entityId: benefit._id,
      metadata: { title: benefit.title, isActive: benefit.isActive },
    });

    return res.status(200).json({ message: "Benefit updated successfully", benefit });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/benefits/:id
 * Admin only. Delete a benefit.
 */
export async function deleteBenefit(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid benefit ID" });
    }

    const benefit = await Benefit.findByIdAndDelete(id).lean();
    if (!benefit) {
      return res.status(404).json({ message: "Benefit not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "BENEFIT_DELETED",
      entityType: "Benefit",
      entityId: benefit._id,
      metadata: { title: benefit.title },
    });

    return res.status(200).json({ message: "Benefit deleted successfully" });
  } catch (err) {
    next(err);
  }
}
