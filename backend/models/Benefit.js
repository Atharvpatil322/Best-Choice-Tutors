/**
 * Benefit Model
 * Stores "Why Choose Us" benefit items shown on the landing page.
 * Data is editable from the admin panel and rendered on the public site.
 * A maximum of 6 active benefits are shown.
 */

import mongoose from "mongoose";

const benefitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    icon: {
      type: String,
      default: "BadgeCheck",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Max active benefits allowed on the "Why Choose Us" section
benefitSchema.statics.MAX_ACTIVE = 6;

// Index for ordering
benefitSchema.index({ order: 1, createdAt: -1 });

const Benefit = mongoose.model("Benefit", benefitSchema);
export default Benefit;
