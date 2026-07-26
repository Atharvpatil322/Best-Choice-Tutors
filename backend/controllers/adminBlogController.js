/**
 * Admin Blog Controller
 * CRUD operations for blog management (admin only).
 */

import Blog from '../models/Blog.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import mongoose from 'mongoose';

/**
 * Helper to create a URL-friendly slug from a title.
 */
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 200);
}

/**
 * POST /api/admin/blog
 * Admin only. Create a new blog post.
 * Body: { title, excerpt, content, author?, category?, imageUrl?, status? }
 */
export async function createBlog(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { title, excerpt, content, author, category, imageUrl, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Generate unique slug
    let slug = createSlug(title);
    let existing = await Blog.findOne({ slug });
    let counter = 1;
    while (existing) {
      slug = `${createSlug(title)}-${counter}`;
      existing = await Blog.findOne({ slug });
      counter++;
    }

    const blogData = {
      title: title.trim(),
      slug,
      excerpt: excerpt ? excerpt.trim() : title.substring(0, 200).trim(),
      content,
      author: author ? author.trim() : 'Best Choice Tutors',
      category: category || 'General',
      imageUrl: imageUrl || null,
      status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      createdBy: req.user._id,
    };

    const blog = await Blog.create(blogData);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: blog.status === 'PUBLISHED' ? 'BLOG_PUBLISHED' : 'BLOG_CREATED',
      entityType: 'Blog',
      entityId: blog._id,
      metadata: { title: blog.title, slug: blog.slug, status: blog.status },
    });

    return res.status(201).json({ message: 'Blog created successfully', blog });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/blog
 * Admin only. List all blogs (including drafts).
 * Query params: page, limit, status
 */
export async function getAllBlogs(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { status } = req.query;

    const filter = {};
    if (status === 'DRAFT' || status === 'PUBLISHED') {
      filter.status = status;
    }

    const [blogs, totalCount] = await Promise.all([
      Blog.find(filter)
        .select('title slug excerpt category author imageUrl status publishedAt createdAt updatedAt createdBy')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      blogs,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/blog/:id
 * Admin only. Get a single blog by ID.
 */
export async function getBlogById(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const blog = await Blog.findById(id).lean();
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/blog/:id
 * Admin only. Update a blog post.
 */
export async function updateBlog(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const existing = await Blog.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const { title, excerpt, content, author, category, imageUrl, status } = req.body;
    const updateData = { updatedBy: req.user._id };

    if (title !== undefined) {
      updateData.title = title.trim();
      // Only regenerate slug if title changed and blog was not already published with that slug
      if (title.trim() !== existing.title) {
        let slug = createSlug(title.trim());
        let slugExists = await Blog.findOne({ slug, _id: { $ne: id } });
        let counter = 1;
        while (slugExists) {
          slug = `${createSlug(title.trim())}-${counter}`;
          slugExists = await Blog.findOne({ slug, _id: { $ne: id } });
          counter++;
        }
        updateData.slug = slug;
      }
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author.trim();
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Handle status transition
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.status = 'PUBLISHED';
      updateData.publishedAt = new Date();
    } else if (status === 'DRAFT' && existing.status !== 'DRAFT') {
      updateData.status = 'DRAFT';
    }

    const blog = await Blog.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: blog.status === 'PUBLISHED' ? 'BLOG_PUBLISHED' : 'BLOG_UPDATED',
      entityType: 'Blog',
      entityId: blog._id,
      metadata: { title: blog.title, slug: blog.slug, status: blog.status },
    });

    return res.status(200).json({ message: 'Blog updated successfully', blog });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/blog/:id
 * Admin only. Delete a blog post.
 */
export async function deleteBlog(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const blog = await Blog.findByIdAndDelete(id).lean();
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: 'BLOG_DELETED',
      entityType: 'Blog',
      entityId: blog._id,
      metadata: { title: blog.title, slug: blog.slug },
    });

    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    next(err);
  }
}

