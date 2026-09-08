import mongoose from 'mongoose';

/**
 * Admin Audit Log (centralized)
 * Immutable append-only log of admin actions: user status, tutor verification, DBS verification, dispute resolution, config changes.
 * Never update or delete. Only create.
 *
 * Fields: adminId (optional for DBS_SUBMITTED), tutorId, documentId (for DBS events), action, entityType, entityId, metadata, createdAt (timestamp)
 */

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional for DBS_SUBMITTED (tutor action, no admin)
      default: null,
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: false,
      default: null,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'USER_SUSPENDED',
        'USER_BANNED',
        'USER_ACTIVATED',
        'TUTOR_APPROVED',
        'TUTOR_REJECTED',
        'TUTOR_VERIFICATION_DOCUMENT_DELETED',
        'DBS_SUBMITTED',
        'DBS_APPROVED',
        'DBS_REJECTED',
        'DBS_VERIFICATION_DOCUMENT_DELETED',
        'DISPUTE_RESOLVED',
        'CONFIG_UPDATED',
        'SUPPORT_TICKET_STATUS_CHANGED',
        'NOTIFICATION_BROADCAST',
        'SEO_CONFIG_CREATED',
        'SEO_CONFIG_UPDATED',
        'SEO_CONFIG_DELETED',
        'BENEFIT_CREATED',
        'BENEFIT_UPDATED',
        'BENEFIT_DELETED',
        'FAQ_CREATED',
        'FAQ_UPDATED',
        'FAQ_DELETED',
        'POPULAR_SEARCH_CREATED',
        'POPULAR_SEARCH_UPDATED',
        'POPULAR_SEARCH_DELETED',
        'BLOG_CREATED',
        'BLOG_UPDATED',
        'BLOG_PUBLISHED',
        'BLOG_DELETED',
        'SEO_SETTINGS_UPDATED',
        'SEO_REDIRECT_CREATED',
        'SEO_REDIRECT_UPDATED',
        'SEO_REDIRECT_DELETED',
        'SEO_PSEO_TEMPLATE_CREATED',
        'SEO_PSEO_TEMPLATE_UPDATED',
        'SEO_PSEO_TEMPLATE_DELETED',
        'SEO_PSEO_PAGES_GENERATED',
        'PAGE_CONTENT_UPDATED',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: [
        'User',
        'Tutor',
        'TutorVerificationDocument',
        'Dispute',
        'Config',
        'DBSVerificationDocument',
        'SupportTicket',
        'Notification',
        'Benefit',
        'FAQ',
        'PopularSearch',
        'Blog',
        'PageSeo',
        'SeoSetting',
        'Redirect',
        'PseoTemplate',
        'PageContent',
      ],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'admin_audit_logs',
  }
);

adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

// Enforce immutability
adminAuditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    next(new Error('AdminAuditLog is immutable: updates and deletes are not allowed'));
  }
);

adminAuditLogSchema.set('versionKey', false);

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
