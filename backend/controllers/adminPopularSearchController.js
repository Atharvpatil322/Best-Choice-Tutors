/**
 * Admin PopularSearch Controller
 * CRUD operations for popular search keywords management (admin only).
 */

import PopularSearch from "../models/PopularSearch.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import mongoose from "mongoose";
import { ensureDefaultPopularSearches } from "../services/landingContentService.js";

/**
 * POST /api/admin/popular-searches
 * Admin only. Create a new popular search.
 * Body: { label, query, order?, isActive? }
 */
export async function createPopularSearch(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { label, query, order, isActive } = req.body;

    if (!label || !query) {
      return res.status(400).json({ message: "Label and query are required" });
    }

    const searchData = {
      label: label.trim(),
      query: query.trim(),
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      createdBy: req.user._id,
    };

    const search = await PopularSearch.create(searchData);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "POPULAR_SEARCH_CREATED",
      entityType: "PopularSearch",
      entityId: search._id,
      metadata: { label: search.label, query: search.query },
    });

    return res.status(201).json({ message: "Popular search created successfully", popularSearch: search });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/popular-searches
 * Admin only. List all popular searches (including inactive).
 * Query params: page, limit, isActive
 */
export async function getAllPopularSearches(req, res, next) {
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

    await ensureDefaultPopularSearches();

    const [searches, totalCount] = await Promise.all([
      PopularSearch.find(filter)
        .select("label query order isActive createdAt updatedAt")
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PopularSearch.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      popularSearches: searches,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/popular-searches/:id
 * Admin only. Get a single popular search by ID.
 */
export async function getPopularSearchById(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid popular search ID" });
    }

    const search = await PopularSearch.findById(id).lean();
    if (!search) {
      return res.status(404).json({ message: "Popular search not found" });
    }

    return res.status(200).json({ popularSearch: search });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/popular-searches/:id
 * Admin only. Update a popular search.
 */
export async function updatePopularSearch(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid popular search ID" });
    }

    const existing = await PopularSearch.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Popular search not found" });
    }

    const { label, query, order, isActive } = req.body;
    const updateData = { updatedBy: req.user._id };

    if (label !== undefined) updateData.label = label.trim();
    if (query !== undefined) updateData.query = query.trim();
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const search = await PopularSearch.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "POPULAR_SEARCH_UPDATED",
      entityType: "PopularSearch",
      entityId: search._id,
      metadata: { label: search.label, isActive: search.isActive },
    });

    return res.status(200).json({ message: "Popular search updated successfully", popularSearch: search });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/popular-searches/:id
 * Admin only. Delete a popular search.
 */
export async function deletePopularSearch(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid popular search ID" });
    }

    const search = await PopularSearch.findByIdAndDelete(id).lean();
    if (!search) {
      return res.status(404).json({ message: "Popular search not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "POPULAR_SEARCH_DELETED",
      entityType: "PopularSearch",
      entityId: search._id,
      metadata: { label: search.label },
    });

    return res.status(200).json({ message: "Popular search deleted successfully" });
  } catch (err) {
    next(err);
  }
}
