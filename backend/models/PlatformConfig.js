import mongoose from 'mongoose';

/**
 * Platform Config (singleton)
 * Single document holding platform-wide settings: commission rate, withdrawal threshold.
 * GET returns the one document; PATCH upserts it.
 */

const platformConfigSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100'],
    },
    minWithdrawalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Min withdrawal amount cannot be negative'],
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'platform_config',
  }
);

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);

export default PlatformConfig;
