/**
 * Admin Blog Controller
 * CRUD operations for blog management (admin only).
 */

import Blog from '../models/Blog.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { uploadImage } from '../services/s3Service.js';
import { moveRedirects } from '../services/redirectMoveService.js';
import { noteSeoChange } from '../services/seoChangeService.js';

/** Lowercase words joined by single hyphens, e.g. "exam-tips-2026". */
const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_IMAGE_WIDTH = 1600;

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
 * POST /api/admin/blog/upload-image
 * Admin only. Upload a blog image to S3 and return its URL.
 * Multipart field: image
 */
export async function uploadBlogImage(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded. Send a single file with field name: image.' });
    }

    // Animated GIFs and SVGs would lose their behaviour if re-encoded, so they
    // are stored as uploaded. Everything else becomes a resized WebP.
    const keepOriginal = ['image/gif', 'image/svg+xml'].includes(req.file.mimetype);
    let buffer = req.file.buffer;
    let mimetype = req.file.mimetype;
    if (!keepOriginal) {
      try {
        buffer = await sharp(req.file.buffer)
          .rotate() // apply EXIF orientation before metadata is stripped
          .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        mimetype = 'image/webp';
      } catch {
        return res.status(400).json({ message: 'Could not process the image. Upload a valid JPG, PNG or WebP file.' });
      }
    }

    const imageUrl = await uploadImage(buffer, {
      folder: 'blog-images',
      mimetype,
      originalName: req.file.originalname,
      // Keys are random UUIDs, so a given URL never changes content.
      cacheControl: 'public, max-age=31536000, immutable',
    });

    return res.status(201).json({ message: 'Blog image uploaded successfully', imageUrl });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/blog
 * Admin only. Create a new blog post.
 * Body: { title, excerpt, content, author?, category?, imageUrl?, imageAlt?, status? }
 */
export async function createBlog(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const { title, excerpt, content, author, category, imageUrl, imageAlt, status, seoTitle, metaDescription } =
      req.body;

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
      imageAlt: imageAlt || null,
      seoTitle: seoTitle ? String(seoTitle).trim() : '',
      metaDescription: metaDescription ? String(metaDescription).trim() : '',
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

    if (blog.status === 'PUBLISHED') noteSeoChange('blog posts');
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
        .select('title slug excerpt category author imageUrl imageAlt status publishedAt createdAt updatedAt createdBy')
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

    const {
      title, excerpt, content, author, category, imageUrl, imageAlt, status,
      slug: requestedSlug, createRedirect, seoTitle, metaDescription,
    } = req.body;
    const updateData = { updatedBy: req.user._id };

    // Editing the title no longer changes the URL: a published post's address
    // is part of its search listing and of every link to it. The URL changes
    // only when the admin edits the URL handle itself.
    if (title !== undefined) updateData.title = title.trim();
    if (requestedSlug !== undefined) {
      const slug = String(requestedSlug).trim().toLowerCase();
      if (!slug || slug.length > 200 || !BLOG_SLUG_PATTERN.test(slug)) {
        return res.status(400).json({
          message: 'URL handle can only contain lowercase letters, numbers and single hyphens',
        });
      }
      if (slug !== existing.slug) {
        if (await Blog.exists({ slug, _id: { $ne: id } })) {
          return res.status(409).json({ message: `Another post already uses /blog/${slug}` });
        }
        updateData.slug = slug;
      }
    }
    if (seoTitle !== undefined) updateData.seoTitle = String(seoTitle).trim();
    if (metaDescription !== undefined) updateData.metaDescription = String(metaDescription).trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author.trim();
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (imageAlt !== undefined) updateData.imageAlt = imageAlt;

    // Handle status transition
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.status = 'PUBLISHED';
      updateData.publishedAt = new Date();
    } else if (status === 'DRAFT' && existing.status !== 'DRAFT') {
      updateData.status = 'DRAFT';
    }

    const blog = await Blog.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();

    // A published post that moved leaves a redirect at its old address unless
    // the admin opted out; a draft was never public, so it needs none.
    let redirect = null;
    if (updateData.slug && existing.status === 'PUBLISHED') {
      try {
        redirect = await moveRedirects(`/blog/${existing.slug}`, `/blog/${blog.slug}`, {
          createRedirect: createRedirect !== false,
          adminId: req.user._id,
          note: 'Blog post URL changed',
        });
      } catch (redirectErr) {
        return res.status(500).json({
          message: `The post moved to /blog/${blog.slug}, but its redirects could not be updated (${redirectErr.message}).`,
          blog,
        });
      }
    }
    if (existing.status === 'PUBLISHED' || blog.status === 'PUBLISHED') noteSeoChange('blog posts');

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: blog.status === 'PUBLISHED' ? 'BLOG_PUBLISHED' : 'BLOG_UPDATED',
      entityType: 'Blog',
      entityId: blog._id,
      metadata: { title: blog.title, slug: blog.slug, status: blog.status },
    });

    return res.status(200).json({ message: 'Blog updated successfully', blog, redirect });
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
    if (blog.status === 'PUBLISHED') noteSeoChange('blog posts');

    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    next(err);
  }
}

