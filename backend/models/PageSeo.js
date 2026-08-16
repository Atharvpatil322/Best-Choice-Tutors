import mongoose from 'mongoose';

const pageSeoSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: [true, 'Path is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    canonicalUrl: {
      type: String,
      default: '',
    },
    keywords: {
      type: String,
      default: '',
    },
    ogTitle: {
      type: String,
      default: '',
    },
    ogDescription: {
      type: String,
      default: '',
    },
    ogType: {
      type: String,
      default: 'website',
    },
  },
  {
    timestamps: true,
    collection: 'page_seo_configs',
  },
);

pageSeoSchema.index({ path: 1 }, { unique: true });

const PageSeo = mongoose.model('PageSeo', pageSeoSchema);
export default PageSeo;
