/**
 * FAQ Model
 * Stores frequently asked questions and answers for the public FAQ section.
 * Data is used to render both the FAQ UI and the JSON-LD FAQPage schema.
 */

import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },
    link: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, "Link cannot exceed 500 characters"],
    },
    /**
     * Subject this FAQ belongs to, e.g. "English". Null means it is general and
     * shows wherever no subject-specific set exists. Validated against the
     * canonical subject list before it reaches the model.
     */
    subject: {
      type: String,
      default: null,
      trim: true,
      index: true,
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
faqSchema.index({ order: 1, createdAt: -1 });
// The public endpoint always filters on subject and isActive together.
faqSchema.index({ subject: 1, isActive: 1, order: 1 });

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
