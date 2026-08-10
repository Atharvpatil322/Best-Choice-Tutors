/**
 * PopularSearch Model
 * Stores popular tutor search keywords shown in the footer.
 * Data is editable from the admin panel.
 */

import mongoose from "mongoose";

const popularSearchSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
      maxlength: [120, "Label cannot exceed 120 characters"],
    },
    query: {
      type: String,
      required: [true, "Query is required"],
      trim: true,
      maxlength: [120, "Query cannot exceed 120 characters"],
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

// Index for ordering
popularSearchSchema.index({ order: 1, createdAt: -1 });

const PopularSearch = mongoose.model("PopularSearch", popularSearchSchema);
export default PopularSearch;
