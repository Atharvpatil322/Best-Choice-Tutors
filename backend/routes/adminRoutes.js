import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getSummary,
  getFinancials,
  getUsers,
  suspendUser,
  banUser,
  activateUser,
  getPendingTutors,
  getTutorsWithVerificationDocuments,
  approveTutor,
  rejectTutor,
  getDbsPendingTutors,
  getTutorVerificationDocuments,
  getTutorDbsDocuments,
  approveDbsDocument,
  rejectDbsDocument,
  getConversations,
  getBookingMessages,
  getReportedReviews,
  getDisputes,
  getDisputeById,
  resolveDisputeHandler,
  getConfig,
  updateConfig,
  getAuditLog,
  getSupportTickets,
  getSupportTicketById,
  replyToSupportTicket,
  updateSupportTicketStatus,
  broadcastNotification,
} from '../controllers/adminController.js';
import {
  getWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  markWithdrawalPaid,
} from '../controllers/adminWithdrawalController.js';

const router = express.Router();

// GET /api/admin/summary - Dashboard summary (admin only, read-only)
router.get('/summary', authenticate, getSummary);
// GET /api/admin/financials - Financial overview (admin only, read-only)
router.get('/financials', authenticate, getFinancials);

// GET /api/admin/users - List users with optional ?role=Learner|Tutor (admin only, read-only)
router.get('/users', authenticate, getUsers);
// PATCH /api/admin/users/:userId/suspend | ban | activate (admin only)
router.patch('/users/:userId/suspend', authenticate, suspendUser);
router.patch('/users/:userId/ban', authenticate, banUser);
router.patch('/users/:userId/activate', authenticate, activateUser);

// GET /api/admin/tutors/pending - List unverified tutors (admin only)
router.get('/tutors/pending', authenticate, getPendingTutors);
// GET /api/admin/tutors/verification - List all tutors with verification documents (admin only; includes approved/rejected so admin can view docs later)
router.get('/tutors/verification', authenticate, getTutorsWithVerificationDocuments);
// PATCH /api/admin/tutors/:tutorId/approve | reject (admin only)
router.patch('/tutors/:tutorId/approve', authenticate, approveTutor);
router.patch('/tutors/:tutorId/reject', authenticate, rejectTutor);
// GET /api/admin/tutors/:tutorId/documents - List tutor verification documents (admin only, read-only)
router.get('/tutors/:tutorId/documents', authenticate, getTutorVerificationDocuments);
// GET /api/admin/tutors/:tutorId/dbs-documents - List tutor DBS documents (admin only, read-only)
router.get('/tutors/:tutorId/dbs-documents', authenticate, getTutorDbsDocuments);

// GET /api/admin/dbs/pending - List tutors who submitted DBS documents (admin only)
router.get('/dbs/pending', authenticate, getDbsPendingTutors);
// PATCH /api/admin/dbs/:documentId/approve | reject (admin only)
router.patch('/dbs/:documentId/approve', authenticate, approveDbsDocument);
router.patch('/dbs/:documentId/reject', authenticate, rejectDbsDocument);

// GET /api/admin/conversations - List all conversations with booking info (admin only, read-only)
router.get('/conversations', authenticate, getConversations);
// GET /api/admin/bookings/:bookingId/messages - Read-only chat messages (admin only)
router.get('/bookings/:bookingId/messages', authenticate, getBookingMessages);

// GET /api/admin/reported-reviews - List reported reviews (admin only, read-only)
router.get('/reported-reviews', authenticate, getReportedReviews);

// GET /api/admin/disputes - List disputes (admin only)
router.get('/disputes', authenticate, getDisputes);
// GET /api/admin/disputes/:disputeId - Get dispute detail (admin only)
router.get('/disputes/:disputeId', authenticate, getDisputeById);
// PATCH /api/admin/disputes/:disputeId/resolve - Resolve dispute (admin only, Phase 10)
router.patch('/disputes/:disputeId/resolve', authenticate, resolveDisputeHandler);

// GET /api/admin/withdrawal-requests?status=PENDING - List withdrawal requests (admin only)
router.get('/withdrawal-requests', authenticate, getWithdrawalRequests);
// PATCH /api/admin/withdrawal-requests/:id/approve - Approve (deduct, audit)
router.patch('/withdrawal-requests/:id/approve', authenticate, approveWithdrawalRequest);
// PATCH /api/admin/withdrawal-requests/:id/reject - Reject (audit only)
router.patch('/withdrawal-requests/:id/reject', authenticate, rejectWithdrawalRequest);
// PATCH /api/admin/withdrawal-requests/:id/paid - Mark PAID after manual transfer (audit only; no booking/TutorEarnings changes)
router.patch('/withdrawal-requests/:id/paid', authenticate, markWithdrawalPaid);

// GET /api/admin/config - Get platform config (admin only, read-only)
router.get('/config', authenticate, getConfig);
// PATCH /api/admin/config - Update platform config (admin only, audit-logged)
router.patch('/config', authenticate, updateConfig);

// GET /api/admin/audit-log - List admin audit log (admin only, read-only)
router.get('/audit-log', authenticate, getAuditLog);

// Support tickets management (admin-only)
// GET /api/admin/support/tickets - list support tickets (optional ?status=...)
router.get('/support/tickets', authenticate, getSupportTickets);
// GET /api/admin/support/tickets/:ticketId - full ticket with messages
router.get('/support/tickets/:ticketId', authenticate, getSupportTicketById);
// POST /api/admin/support/tickets/:ticketId/messages - admin reply
router.post('/support/tickets/:ticketId/messages', authenticate, replyToSupportTicket);
// PATCH /api/admin/support/tickets/:ticketId/status - update status (IN_PROGRESS | CLOSED)
router.patch('/support/tickets/:ticketId/status', authenticate, updateSupportTicketStatus);

// POST /api/admin/notifications/broadcast - Send notification to all learners and tutors
router.post('/notifications/broadcast', authenticate, broadcastNotification);

export default router;
