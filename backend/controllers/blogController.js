/**
 * Blog Controller (Public)
 * Read-only endpoints for published blogs.
 */

import Blog from '../models/Blog.js';

/**
 * GET /api/blog
 * Public. List published blogs with pagination.
 * Query params: page, limit, category
 */
export async function getPublishedBlogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const { category } = req.query;

    const filter = { status: 'PUBLISHED' };
    if (category && ['Student', 'Parents', 'Tutor', 'General'].includes(category)) {
      filter.category = category;
    }

    const [blogs, totalCount] = await Promise.all([
      Blog.find(filter)
        .select('title slug excerpt category author imageUrl publishedAt createdAt')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      blogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/blog/:slug
 * Public. Get a single published blog by slug.
 */
export async function getBlogBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'PUBLISHED' })
      .select('title slug excerpt content author category imageUrl publishedAt createdAt updatedAt')
      .lean();

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
}

