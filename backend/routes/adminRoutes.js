import express from "express";
import * as seoTools from "../controllers/adminSeoToolsController.js";
import * as pageContent from "../controllers/pageContentController.js";
import { authenticate } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
} from "../controllers/adminBlogController.js";
import {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
} from "../controllers/adminFaqController.js";
import {
  createBenefit,
  getAllBenefits,
  getBenefitById,
  updateBenefit,
  deleteBenefit,
} from "../controllers/adminBenefitController.js";
import {
  createPopularSearch,
  getAllPopularSearches,
  getPopularSearchById,
  updatePopularSearch,
  deletePopularSearch,
} from "../controllers/adminPopularSearchController.js";
import {
  getSummary,
  getFinancials,
  getUsers,
  exportFinancialsExcel,
  exportUsersExcel,
  suspendUser,
  banUser,
  activateUser,
  getPendingTutors,
  getTutorsWithVerificationDocuments,
  approveTutor,
  rejectTutor,
  getDbsPendingTutors,
  getTutorVerificationDocuments,
  deleteTutorVerificationDocument,
  getTutorDbsDocuments,
  deleteDbsVerificationDocument,
  approveDbsDocument,
  rejectDbsDocument,
  getConversations,
  getBookingMessages,
  getReportedReviews,
  getConfig,
  updateConfig,
  getAuditLog,
  getSupportTickets,
  getSupportTicketById,
  replyToSupportTicket,
  updateSupportTicketStatus,
  broadcastNotification,
  syncTutorPayouts,
} from "../controllers/adminController.js";
import {
  getSeoConfigs,
  getSeoConfigById,
  createSeoConfig,
  updateSeoConfig,
  deleteSeoConfig,
} from "../controllers/adminSeoController.js";
const router = express.Router();

// GET /api/admin/summary - Dashboard summary (admin only, read-only)
router.get("/summary", authenticate, getSummary);
// GET /api/admin/financials - Financial overview (admin only, read-only)
router.get("/financials", authenticate, getFinancials);

// GET /api/admin/exports/financials - Export financial overview as .xlsx
router.get("/exports/financials", authenticate, exportFinancialsExcel);

// GET /api/admin/users - List users with optional ?role=Learner|Tutor (admin only, read-only)
router.get("/users", authenticate, getUsers);

// GET /api/admin/exports/users - Export users as .xlsx
router.get("/exports/users", authenticate, exportUsersExcel);
// PATCH /api/admin/users/:userId/suspend | ban | activate (admin only)
router.patch("/users/:userId/suspend", authenticate, suspendUser);
router.patch("/users/:userId/ban", authenticate, banUser);
router.patch("/users/:userId/activate", authenticate, activateUser);

// GET /api/admin/tutors/pending - List unverified tutors (admin only)
router.get("/tutors/pending", authenticate, getPendingTutors);
// GET /api/admin/tutors/verification - List all tutors with verification documents (admin only; includes approved/rejected so admin can view docs later)
router.get(
  "/tutors/verification",
  authenticate,
  getTutorsWithVerificationDocuments,
);
// PATCH /api/admin/tutors/:tutorId/approve | reject (admin only)
router.patch("/tutors/:tutorId/approve", authenticate, approveTutor);
router.patch("/tutors/:tutorId/reject", authenticate, rejectTutor);
// GET /api/admin/tutors/:tutorId/documents - List tutor verification documents (admin only, read-only)
router.get(
  "/tutors/:tutorId/documents",
  authenticate,
  getTutorVerificationDocuments,
);
// DELETE /api/admin/tutors/:tutorId/documents/:documentId - Delete a tutor verification document (admin only)
router.delete(
  "/tutors/:tutorId/documents/:documentId",
  authenticate,
  deleteTutorVerificationDocument,
);
// GET /api/admin/tutors/:tutorId/dbs-documents - List tutor DBS documents (admin only, read-only)
router.get(
  "/tutors/:tutorId/dbs-documents",
  authenticate,
  getTutorDbsDocuments,
);
// DELETE /api/admin/tutors/:tutorId/dbs-documents/:documentId - Delete a tutor DBS document (admin only)
router.delete(
  "/tutors/:tutorId/dbs-documents/:documentId",
  authenticate,
  deleteDbsVerificationDocument,
);

// GET /api/admin/dbs/pending - List tutors who submitted DBS documents (admin only)
router.get("/dbs/pending", authenticate, getDbsPendingTutors);
// PATCH /api/admin/dbs/:documentId/approve | reject (admin only)
router.patch("/dbs/:documentId/approve", authenticate, approveDbsDocument);
router.patch("/dbs/:documentId/reject", authenticate, rejectDbsDocument);

// GET /api/admin/conversations - List all conversations with booking info (admin only, read-only)
router.get("/conversations", authenticate, getConversations);
// GET /api/admin/bookings/:bookingId/messages - Read-only chat messages (admin only)
router.get("/bookings/:bookingId/messages", authenticate, getBookingMessages);

// GET /api/admin/reported-reviews - List reported reviews (admin only, read-only)
router.get("/reported-reviews", authenticate, getReportedReviews);

// GET /api/admin/config - Get platform config (admin only, read-only)
router.get("/config", authenticate, getConfig);
// PATCH /api/admin/config - Update platform config (admin only, audit-logged)
router.patch("/config", authenticate, updateConfig);

// SEO settings management routes (admin only)
router.get("/seo", authenticate, getSeoConfigs);
router.get("/seo/:id", authenticate, getSeoConfigById);
router.post("/seo", authenticate, createSeoConfig);
router.put("/seo/:id", authenticate, updateSeoConfig);
router.delete("/seo/:id", authenticate, deleteSeoConfig);

// GET /api/admin/audit-log - List admin audit log (admin only, read-only)
router.get("/audit-log", authenticate, getAuditLog);

// ---------------------------------------------------------------- SEO tools
// Tabbed SEO section: site-wide settings, redirects, 404 log, programmatic pages.
// ------------------------------------------------------------- Page content
router.get("/pages/registry", authenticate, pageContent.getPageRegistry);
router.get("/pages/:pageKey", authenticate, pageContent.getAdminPageContent);
router.put("/pages/:pageKey/:sectionKey", authenticate, pageContent.updatePageSection);
router.delete("/pages/:pageKey/:sectionKey", authenticate, pageContent.resetPageSection);

router.get("/seo-tools/dashboard", authenticate, seoTools.getSeoDashboard);

router.get("/seo-tools/settings", authenticate, seoTools.getSettings);
router.patch("/seo-tools/settings", authenticate, seoTools.updateSettings);

router.get("/seo-tools/redirects", authenticate, seoTools.listRedirects);
router.post("/seo-tools/redirects", authenticate, seoTools.createRedirect);
router.put("/seo-tools/redirects/:id", authenticate, seoTools.updateRedirect);
router.delete("/seo-tools/redirects/:id", authenticate, seoTools.deleteRedirect);

router.get("/seo-tools/not-found", authenticate, seoTools.listNotFound);
router.post("/seo-tools/not-found/clear", authenticate, seoTools.clearNotFound);
router.delete("/seo-tools/not-found/:id", authenticate, seoTools.deleteNotFound);

router.get("/seo-tools/pseo/templates", authenticate, seoTools.listPseoTemplates);
router.post("/seo-tools/pseo/templates", authenticate, seoTools.createPseoTemplate);
router.put("/seo-tools/pseo/templates/:id", authenticate, seoTools.updatePseoTemplate);
router.delete("/seo-tools/pseo/templates/:id", authenticate, seoTools.deletePseoTemplate);
router.post("/seo-tools/pseo/templates/:id/preview", authenticate, seoTools.previewPseoTemplate);
router.post("/seo-tools/pseo/templates/:id/generate", authenticate, seoTools.generatePseoPages);

router.get("/seo-tools/pseo/pages", authenticate, seoTools.listPseoPages);
router.put("/seo-tools/pseo/pages/:id", authenticate, seoTools.updatePseoPage);
router.delete("/seo-tools/pseo/pages/:id", authenticate, seoTools.deletePseoPage);

// Support tickets management (admin-only)
// GET /api/admin/support/tickets - list support tickets (optional ?status=...)
router.get("/support/tickets", authenticate, getSupportTickets);
// GET /api/admin/support/tickets/:ticketId - full ticket with messages
router.get("/support/tickets/:ticketId", authenticate, getSupportTicketById);
// POST /api/admin/support/tickets/:ticketId/messages - admin reply
router.post(
  "/support/tickets/:ticketId/messages",
  authenticate,
  replyToSupportTicket,
);
// PATCH /api/admin/support/tickets/:ticketId/status - update status (IN_PROGRESS | CLOSED)
router.patch(
  "/support/tickets/:ticketId/status",
  authenticate,
  updateSupportTicketStatus,
);

// POST /api/admin/notifications/broadcast - Send notification to all learners and tutors
router.post("/notifications/broadcast", authenticate, broadcastNotification);

// POST /api/admin/tutors/:tutorId/payout-sync - Force sync payouts for a tutor
router.post("/tutors/:tutorId/payout-sync", authenticate, syncTutorPayouts);

// Blog management routes (admin only)
// POST /api/admin/blog/upload-image - Upload a blog image
router.post("/blog/upload-image", authenticate, upload.single("image"), uploadBlogImage);
// POST /api/admin/blog - Create a new blog
router.post("/blog", authenticate, createBlog);
// GET /api/admin/blog - List all blogs (including drafts)
router.get("/blog", authenticate, getAllBlogs);
// GET /api/admin/blog/:id - Get a single blog by ID
router.get("/blog/:id", authenticate, getBlogById);
// PUT /api/admin/blog/:id - Update a blog
router.put("/blog/:id", authenticate, updateBlog);
// DELETE /api/admin/blog/:id - Delete a blog
router.delete("/blog/:id", authenticate, deleteBlog);

// FAQ management routes (admin only)
// POST /api/admin/faq - Create a new FAQ
router.post("/faq", authenticate, createFaq);
// GET /api/admin/faq - List all FAQs (including inactive)
router.get("/faq", authenticate, getAllFaqs);
// GET /api/admin/faq/:id - Get a single FAQ by ID
router.get("/faq/:id", authenticate, getFaqById);
// PUT /api/admin/faq/:id - Update a FAQ
router.put("/faq/:id", authenticate, updateFaq);
// DELETE /api/admin/faq/:id - Delete a FAQ
router.delete("/faq/:id", authenticate, deleteFaq);

// Benefit management routes (admin only)
// POST /api/admin/benefits - Create a new benefit
router.post("/benefits", authenticate, createBenefit);
router.post("/why-choose-us", authenticate, createBenefit);
router.post("/benefit", authenticate, createBenefit);
// GET /api/admin/benefits - List all benefits (including inactive)
router.get("/benefits", authenticate, getAllBenefits);
router.get("/why-choose-us", authenticate, getAllBenefits);
router.get("/benefit", authenticate, getAllBenefits);
// GET /api/admin/benefits/:id - Get a single benefit by ID
router.get("/benefits/:id", authenticate, getBenefitById);
router.get("/why-choose-us/:id", authenticate, getBenefitById);
router.get("/benefit/:id", authenticate, getBenefitById);
// PUT /api/admin/benefits/:id - Update a benefit
router.put("/benefits/:id", authenticate, updateBenefit);
router.put("/why-choose-us/:id", authenticate, updateBenefit);
router.put("/benefit/:id", authenticate, updateBenefit);
// DELETE /api/admin/benefits/:id - Delete a benefit
router.delete("/benefits/:id", authenticate, deleteBenefit);
router.delete("/why-choose-us/:id", authenticate, deleteBenefit);
router.delete("/benefit/:id", authenticate, deleteBenefit);

// Popular search management routes (admin only)
// POST /api/admin/popular-searches - Create a new popular search
router.post("/popular-searches", authenticate, createPopularSearch);
router.post("/popular-search", authenticate, createPopularSearch);
// GET /api/admin/popular-searches - List all popular searches (including inactive)
router.get("/popular-searches", authenticate, getAllPopularSearches);
router.get("/popular-search", authenticate, getAllPopularSearches);
// GET /api/admin/popular-searches/:id - Get a single popular search by ID
router.get("/popular-searches/:id", authenticate, getPopularSearchById);
router.get("/popular-search/:id", authenticate, getPopularSearchById);
// PUT /api/admin/popular-searches/:id - Update a popular search
router.put("/popular-searches/:id", authenticate, updatePopularSearch);
router.put("/popular-search/:id", authenticate, updatePopularSearch);
// DELETE /api/admin/popular-searches/:id - Delete a popular search
router.delete("/popular-searches/:id", authenticate, deletePopularSearch);
router.delete("/popular-search/:id", authenticate, deletePopularSearch);

export default router;
