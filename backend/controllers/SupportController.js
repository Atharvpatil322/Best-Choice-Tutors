import mongoose from 'mongoose';
import SupportTicket from '../models/SupportTicket.js';

const mapUserRoleToSupportRole = (userRole) => {
  if (userRole === 'Learner') return 'LEARNER';
  if (userRole === 'Tutor') return 'TUTOR';
  return null;
};

// 1) POST /api/support/tickets - Create ticket
export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body ?? {};

    // Validate subject
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length > 200) {
      return res.status(400).json({ message: 'Subject must be at most 200 characters' });
    }

    // Validate message
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'First message is required' });
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 5000) {
      return res.status(400).json({ message: 'Message must be at most 5000 characters' });
    }

    const createdByRole = mapUserRoleToSupportRole(req.user.role);
    if (!createdByRole) {
      return res.status(403).json({ message: 'Only learners and tutors can create support tickets' });
    }

    // Prevent duplicate ticket creation: check if same user created a ticket with same subject in last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentDuplicate = await SupportTicket.findOne({
      createdByUserId: req.user._id,
      subject: trimmedSubject,
      createdAt: { $gte: fiveSecondsAgo },
    });

    if (recentDuplicate) {
      return res.status(409).json({
        message: 'A ticket with this subject was recently created. Please wait a moment or use the existing ticket.',
        ticketId: recentDuplicate._id.toString(),
      });
    }

    const now = new Date();

    const ticket = await SupportTicket.create({
      createdByUserId: req.user._id,
      createdByRole,
      subject: trimmedSubject,
      status: 'OPEN',
      messages: [
        {
          senderUserId: req.user._id,
          senderRole: createdByRole,
          message: trimmedMessage,
          createdAt: now,
        },
      ],
      lastMessageAt: now,
    });

    return res.status(201).json({
      message: 'Support ticket created',
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// 2) GET /api/support/tickets - list own tickets
export const listOwnSupportTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ createdByUserId: req.user._id })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ tickets });
  } catch (err) {
    next(err);
  }
};

// 3) GET /api/support/tickets/:ticketId - get ticket if user owns it
export const getOwnSupportTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      createdByUserId: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    next(err);
  }
};

// 4) POST /api/support/tickets/:ticketId/messages - append message
export const appendSupportTicketMessage = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    // Validate message
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 5000) {
      return res.status(400).json({ message: 'Message must be at most 5000 characters' });
    }

    const senderRole = mapUserRoleToSupportRole(req.user.role);
    if (!senderRole) {
      return res.status(403).json({ message: 'Only learners and tutors can reply to support tickets' });
    }

    // First, verify ticket exists and user owns it
    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      createdByUserId: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Prevent replying to CLOSED ticket
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ message: 'Cannot reply to a closed ticket' });
    }

    // Turn-based messaging: User can only send a message if the last message was from ADMIN
    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastSenderRole = lastMessage?.senderRole;

      // If last message was from a user (LEARNER or TUTOR), reject
      // User must wait for admin reply before sending another message
      if (lastSenderRole === 'LEARNER' || lastSenderRole === 'TUTOR') {
        return res.status(403).json({
          message: 'Please wait for support to reply before sending another message.',
        });
      }

      // If last message was ADMIN, allow user to reply (continue below)
    }
    // If messages array is empty (edge case), allow user message

    const now = new Date();

    // Use findOneAndUpdate with condition to atomically check last message before updating
    // This prevents race conditions where multiple requests pass the check simultaneously
    const updatedTicket = await SupportTicket.findOneAndUpdate(
      {
        _id: ticketId,
        createdByUserId: req.user._id,
        status: { $ne: 'CLOSED' },
        // Only allow update if messages array is empty OR last message is from ADMIN
        $or: [
          { messages: { $size: 0 } },
          {
            $expr: {
              $eq: [
                { $arrayElemAt: ['$messages.senderRole', -1] },
                'ADMIN',
              ],
            },
          },
        ],
      },
      {
        $push: {
          messages: {
            senderUserId: req.user._id,
            senderRole,
            message: trimmedMessage,
            createdAt: now,
          },
        },
        $set: {
          lastMessageAt: now,
        },
      },
      { new: true, runValidators: true }
    );

    // If update returned null, it means the condition wasn't met (likely last message was from user)
    if (!updatedTicket) {
      return res.status(403).json({
        message: 'Please wait for support to reply before sending another message.',
      });
    }

    return res.status(201).json({
      message: 'Message added to ticket',
      ticket: updatedTicket,
    });
  } catch (err) {
    next(err);
  }
};

// 5) DELETE /api/support/tickets/:ticketId - delete a ticket created by the logged-in user
export const deleteSupportTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const deleted = await SupportTicket.findOneAndDelete({
      _id: ticketId,
      createdByUserId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json({
      message: 'Support ticket deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};


