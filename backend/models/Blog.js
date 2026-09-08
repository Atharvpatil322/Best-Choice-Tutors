import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    author: {
      type: String,
      default: 'Best Choice Tutors',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Student', 'Parents', 'Tutor', 'General'],
      default: 'General',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    /**
     * Alternative text for the cover image. Required by screen readers and used
     * by search engines to understand image content, so it is stored with the
     * post rather than derived from the filename.
     */
    imageAlt: {
      type: String,
      default: null,
      trim: true,
      maxlength: [250, 'Image alt text cannot exceed 250 characters'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'DRAFT',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for published blog queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;

