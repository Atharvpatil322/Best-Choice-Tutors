import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createSupportTicket,
  listOwnSupportTickets,
  getOwnSupportTicketById,
  appendSupportTicketMessage,
  deleteSupportTicket,
} from '../controllers/supportController.js';

const router = express.Router();

// All support routes require authentication
router.use(authenticate);

// POST /api/support/tickets - create a new support ticket (Learner/Tutor)
router.post('/tickets', createSupportTicket);

// GET /api/support/tickets - list tickets created by the logged-in user
router.get('/tickets', listOwnSupportTickets);

// GET /api/support/tickets/:ticketId - get a single ticket (only if user owns it)
router.get('/tickets/:ticketId', getOwnSupportTicketById);

// POST /api/support/tickets/:ticketId/messages - append a new message to an existing ticket
router.post('/tickets/:ticketId/messages', appendSupportTicketMessage);

// DELETE /api/support/tickets/:ticketId - delete a ticket created by the logged-in user
router.delete('/tickets/:ticketId', deleteSupportTicket);

export default router;

