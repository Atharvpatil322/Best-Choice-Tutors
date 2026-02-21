/**
 * Admin Controller
 * Read-only APIs and admin actions (e.g. dispute resolution).
 */

import Review from "../models/Review.js";
import Dispute from "../models/Dispute.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Tutor from "../models/Tutor.js";
import TutorVerificationDocument from "../models/TutorVerificationDocument.js";
import DBSVerificationDocument from "../models/DBSVerificationDocument.js";
import TutorEarnings from "../models/TutorEarnings.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import Conversation from "../models/Conversation.js";
import PlatformConfig from "../models/PlatformConfig.js";
import SupportTicket from "../models/SupportTicket.js";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { resolveDispute, DisputeError } from "../services/disputeService.js";
import { presignDocumentUrl } from "../services/s3Service.js";

/**
 * GET /api/admin/summary
 * Admin only. Read-only aggregation: totalUsers, totalTutors, totalLearners, totalBookings, totalRevenue, totalEscrowAmount.
 * Revenue = sum of TutorEarnings.amount where status === 'available'. Escrow = sum where status === 'pendingRelease'. Amounts in paise.
 */
export async function getSummary(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const [
      totalUsers,
      totalTutors,
      totalLearners,
      totalBookings,
      revenueResult,
      escrowResult,
    ] = await Promise.all([
      User.countDocuments(),
      Tutor.countDocuments(),
      User.countDocuments({ role: "Learner" }),
      Booking.countDocuments(),
      TutorEarnings.aggregate([
        { $match: { status: "available" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TutorEarnings.aggregate([
        { $match: { status: "pendingRelease" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;
    const totalEscrowAmount = escrowResult[0]?.total ?? 0;

    return res.status(200).json({
      totalUsers,
      totalTutors,
      totalLearners,
      totalBookings,
      totalRevenue,
      totalEscrowAmount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/financials
 * Admin only. Read-only financial overview from TutorEarnings and Dispute.
 * Amounts in paise. totalPayments = sum of all TutorEarnings; totalEscrow = pendingRelease; totalPaidOut = available; totalRefunded = refunded.
 */
export async function getFinancials(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const [
      paymentsResult,
      escrowResult,
      paidOutResult,
      refundedResult,
      activeDisputesCount,
    ] = await Promise.all([
      TutorEarnings.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TutorEarnings.aggregate([
        { $match: { status: "pendingRelease" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TutorEarnings.aggregate([
        { $match: { status: "available" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TutorEarnings.aggregate([
        { $match: { status: "refunded" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Dispute.countDocuments({ status: "OPEN" }),
    ]);

    const totalPayments = paymentsResult[0]?.total ?? 0;
    const totalEscrow = escrowResult[0]?.total ?? 0;
    const totalPaidOut = paidOutResult[0]?.total ?? 0;
    const totalRefunded = refundedResult[0]?.total ?? 0;

    return res.status(200).json({
      totalPayments,
      totalEscrow,
      totalPaidOut,
      totalRefunded,
      activeDisputesCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 * Admin only. Read-only list of users. Optional filter: ?role=Learner | ?role=Tutor.
 * Returns basic profile and status (ACTIVE | SUSPENDED | BANNED).
 */
export async function getUsers(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { role } = req.query ?? {};
    const filter = {};
    if (role === "Learner" || role === "Tutor") {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select(
        "name email role status profilePhoto authProvider phone gender createdAt",
      )
      .lean()
      .sort({ createdAt: -1 });

    const items = users.map((u) => ({
      id: u._id.toString(),
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "Learner",
      profilePhoto: u.profilePhoto ?? null,
      authProvider: u.authProvider ?? null,
      phone: u.phone
        ? {
            countryCode: u.phone.countryCode ?? null,
            number: u.phone.number ?? null,
          }
        : null,
      gender: u.gender ?? null,
      createdAt: u.createdAt,
      status: u.status ?? "ACTIVE",
    }));

    return res.status(200).json({
      count: items.length,
      users: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Set user account status. Admin only. Cannot change own status.
 * @param {'ACTIVE' | 'SUSPENDED' | 'BANNED'} newStatus
 */
async function setUserStatus(req, res, next, newStatus) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const userId = req.params.userId;
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: "Cannot change your own account status",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: newStatus },
      { new: true, runValidators: true },
    )
      .select("name email role status createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const action =
      newStatus === "SUSPENDED"
        ? "USER_SUSPENDED"
        : newStatus === "BANNED"
          ? "USER_BANNED"
          : "USER_ACTIVATED";
    await AdminAuditLog.create({
      adminId: req.user._id,
      action,
      entityType: "User",
      entityId: user._id,
      metadata: { email: user.email, role: user.role },
    });

    return res.status(200).json({
      message: `User ${newStatus.toLowerCase()} successfully`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status ?? "ACTIVE",
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:userId/suspend
 * Admin only. Sets user status to SUSPENDED.
 */
export async function suspendUser(req, res, next) {
  return setUserStatus(req, res, next, "SUSPENDED");
}

/**
 * PATCH /api/admin/users/:userId/ban
 * Admin only. Sets user status to BANNED.
 */
export async function banUser(req, res, next) {
  return setUserStatus(req, res, next, "BANNED");
}

/**
 * PATCH /api/admin/users/:userId/activate
 * Admin only. Sets user status to ACTIVE.
 */
export async function activateUser(req, res, next) {
  return setUserStatus(req, res, next, "ACTIVE");
}

/**
 * GET /api/admin/tutors/verification
 * Admin only. Returns all tutors who have at least one verification document (pending, approved, or rejected).
 * Same behaviour as DBS: admin can always see and view documents even after approve/reject.
 */
export async function getTutorsWithVerificationDocuments(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorIds = await TutorVerificationDocument.distinct("tutorId");
    if (tutorIds.length === 0) {
      return res.status(200).json({ count: 0, tutors: [] });
    }

    const tutors = await Tutor.find({ _id: { $in: tutorIds } })
      .populate("userId", "name email")
      .lean()
      .sort({ createdAt: 1 });

    const items = tutors.map((t) => ({
      id: t._id.toString(),
      userId: t.userId?._id?.toString() ?? t.userId?.toString() ?? null,
      fullName: t.fullName ?? "",
      email: t.userId?.email ?? null,
      subjects: t.subjects ?? [],
      experienceYears: t.experienceYears ?? 0,
      hourlyRate: t.hourlyRate ?? null,
      mode: t.mode ?? null,
      location: t.location ?? null,
      isVerified: t.isVerified ?? false,
      verificationRejectedAt: t.verificationRejectedAt ?? null,
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      count: items.length,
      tutors: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/tutors/pending
 * Admin only. Returns tutors where isVerified === false (verification queue).
 */
export async function getPendingTutors(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutors = await Tutor.find({
      isVerified: false,
      $or: [{ verificationRejectedAt: null }, { verificationRejectedAt: { $exists: false } }],
    })
      .populate("userId", "name email")
      .lean()
      .sort({ createdAt: 1 });

    const items = tutors.map((t) => ({
      id: t._id.toString(),
      userId: t.userId?._id?.toString() ?? t.userId?.toString() ?? null,
      fullName: t.fullName ?? "",
      email: t.userId?.email ?? null,
      subjects: t.subjects ?? [],
      experienceYears: t.experienceYears ?? 0,
      hourlyRate: t.hourlyRate ?? null,
      mode: t.mode ?? null,
      location: t.location ?? null,
      isVerified: false,
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      count: items.length,
      tutors: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/tutors/:tutorId/approve
 * Admin only. Sets Tutor.isVerified = true and logs admin action.
 */
export async function approveTutor(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorId = req.params.tutorId;
    const tutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { isVerified: true },
      { new: true, runValidators: true },
    )
      .select("userId fullName isVerified createdAt")
      .lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "TUTOR_APPROVED",
      entityType: "Tutor",
      entityId: tutor._id,
      metadata: { fullName: tutor.fullName, userId: tutor.userId?.toString() },
    });

    return res.status(200).json({
      message: "Tutor approved successfully",
      tutor: {
        id: tutor._id.toString(),
        userId: tutor.userId?.toString() ?? null,
        fullName: tutor.fullName,
        isVerified: tutor.isVerified ?? true,
        createdAt: tutor.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/tutors/:tutorId/reject
 * Admin only. Keeps isVerified = false and logs admin action.
 */
export async function rejectTutor(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorId = req.params.tutorId;
    const tutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { verificationRejectedAt: new Date() },
      { new: true, runValidators: true }
    )
      .select("userId fullName isVerified verificationRejectedAt createdAt")
      .lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "TUTOR_REJECTED",
      entityType: "Tutor",
      entityId: tutor._id,
      metadata: { fullName: tutor.fullName, userId: tutor.userId?.toString() },
    });

    return res.status(200).json({
      message: "Tutor rejected",
      tutor: {
        id: tutor._id.toString(),
        userId: tutor.userId?.toString() ?? null,
        fullName: tutor.fullName,
        isVerified: tutor.isVerified ?? false,
        verificationRejectedAt: tutor.verificationRejectedAt,
        createdAt: tutor.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dbs/pending
 * Admin only. Returns tutors who have at least one DBS document, with basic profile and DBS documents only.
 */
export async function getDbsPendingTutors(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorIds = await DBSVerificationDocument.distinct("tutorId");
    if (tutorIds.length === 0) {
      return res.status(200).json({ count: 0, tutors: [] });
    }

    const [tutors, dbsDocs] = await Promise.all([
      Tutor.find({ _id: { $in: tutorIds } })
        .populate("userId", "name email")
        .lean()
        .sort({ createdAt: 1 }),
      DBSVerificationDocument.find({ tutorId: { $in: tutorIds } })
        .sort({ uploadedAt: -1 })
        .lean(),
    ]);

    const docsByTutor = {};
    for (const d of dbsDocs) {
      const id = d.tutorId?.toString() ?? d.tutorId;
      if (!docsByTutor[id]) docsByTutor[id] = [];
      const fileUrl = await presignDocumentUrl(d.fileUrl ?? "");
      docsByTutor[id].push({
        id: d._id.toString(),
        tutorId: id,
        fileName: d.fileName ?? "",
        fileType: d.fileType ?? null,
        fileUrl: fileUrl ?? "",
        storageKey: d.storageKey ?? "",
        status: d.status ?? "PENDING",
        uploadedAt: d.uploadedAt,
      });
    }

    const items = tutors.map((t) => ({
      id: t._id.toString(),
      userId: t.userId?._id?.toString() ?? t.userId?.toString() ?? null,
      fullName: t.fullName ?? "",
      email: t.userId?.email ?? null,
      subjects: t.subjects ?? [],
      experienceYears: t.experienceYears ?? 0,
      hourlyRate: t.hourlyRate ?? null,
      mode: t.mode ?? null,
      location: t.location ?? null,
      isVerified: t.isVerified ?? false,
      isDbsVerified: t.isDbsVerified ?? false,
      createdAt: t.createdAt,
      dbsDocuments: docsByTutor[t._id.toString()] ?? [],
    }));

    return res.status(200).json({
      count: items.length,
      tutors: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/tutors/:tutorId/documents
 * Admin only. Read-only. Returns list of tutor verification documents with fileUrl.
 */
export async function getTutorVerificationDocuments(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorIdParam = req.params.tutorId;
    console.log("[TutorVerification] GET documents tutorIdParam:", tutorIdParam);
    let tutorId;
    try {
      tutorId = new mongoose.Types.ObjectId(tutorIdParam);
    } catch (e) {
      console.log("[TutorVerification] Invalid tutor ID:", tutorIdParam, e.message);
      return res.status(400).json({ message: "Invalid tutor ID" });
    }
    const docs = await TutorVerificationDocument.find({ tutorId })
      .sort({ uploadedAt: -1 })
      .lean();
    console.log("[TutorVerification] find result for tutorId:", tutorId.toString(), "count:", docs.length, docs.length ? "sample docId:" + docs[0]?._id + " fileUrl:" + (docs[0]?.fileUrl ? "present" : "missing") : "");

    const documents = await Promise.all(
      docs.map(async (d) => {
        const fileUrl = await presignDocumentUrl(d.fileUrl ?? "");
        return {
          id: d._id.toString(),
          tutorId: d.tutorId?.toString() ?? d.tutorId,
          fileName: d.fileName ?? "",
          fileType: d.fileType ?? null,
          fileUrl: fileUrl ?? "",
          uploadedAt: d.uploadedAt,
        };
      }),
    );

    console.log("[TutorVerification] returning documents count:", documents.length);
    return res.status(200).json({
      tutorId: tutorIdParam,
      count: documents.length,
      documents,
    });
  } catch (err) {
    console.error("[TutorVerification] getTutorVerificationDocuments error:", err.message, err.stack);
    next(err);
  }
}

/**
 * GET /api/admin/tutors/:tutorId/dbs-documents
 * Admin only. Read-only. Returns DBS documents for the tutor (fileUrl, status).
 */
export async function getTutorDbsDocuments(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const tutorId = req.params.tutorId;
    const docs = await DBSVerificationDocument.find({ tutorId })
      .sort({ uploadedAt: -1 })
      .lean();

    const documents = await Promise.all(
      docs.map(async (d) => {
        const fileUrl = await presignDocumentUrl(d.fileUrl ?? "");
        return {
          id: d._id.toString(),
          tutorId: d.tutorId?.toString() ?? d.tutorId,
          fileName: d.fileName ?? "",
          fileType: d.fileType ?? null,
          fileUrl: fileUrl ?? "",
          status: d.status ?? "PENDING",
          uploadedAt: d.uploadedAt,
        };
      }),
    );

    return res.status(200).json({
      tutorId,
      count: documents.length,
      documents,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/dbs/:documentId/approve
 * Admin only. Sets document status = APPROVED, Tutor.isDbsVerified = true, logs action.
 */
export async function approveDbsDocument(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const documentId = req.params.documentId;
    const doc = await DBSVerificationDocument.findById(documentId).lean();
    if (!doc) {
      return res.status(404).json({ message: "DBS document not found" });
    }

    await Promise.all([
      DBSVerificationDocument.findByIdAndUpdate(documentId, {
        $set: { status: "APPROVED" },
      }),
      Tutor.findByIdAndUpdate(doc.tutorId, { $set: { isDbsVerified: true } }),
    ]);

    await AdminAuditLog.create({
      adminId: req.user._id,
      tutorId: doc.tutorId,
      documentId: doc._id,
      action: "DBS_APPROVED",
      entityType: "DBSVerificationDocument",
      entityId: doc._id,
      metadata: { fileName: doc.fileName ?? "" },
    });

    return res.status(200).json({
      message: "DBS document approved. Tutor is now DBS verified.",
      document: {
        id: doc._id.toString(),
        tutorId: doc.tutorId?.toString?.() ?? doc.tutorId?.toString(),
        status: "APPROVED",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/dbs/:documentId/reject
 * Admin only. Sets document status = REJECTED. Tutor remains not DBS verified. Logs action.
 */
export async function rejectDbsDocument(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const documentId = req.params.documentId;
    const doc = await DBSVerificationDocument.findById(documentId).lean();
    if (!doc) {
      return res.status(404).json({ message: "DBS document not found" });
    }

    await DBSVerificationDocument.findByIdAndUpdate(documentId, {
      $set: { status: "REJECTED" },
    });

    await AdminAuditLog.create({
      adminId: req.user._id,
      tutorId: doc.tutorId,
      documentId: doc._id,
      action: "DBS_REJECTED",
      entityType: "DBSVerificationDocument",
      entityId: doc._id,
      metadata: { fileName: doc.fileName ?? "" },
    });

    return res.status(200).json({
      message: "DBS document rejected.",
      document: {
        id: doc._id.toString(),
        tutorId: doc.tutorId?.toString?.() ?? doc.tutorId?.toString(),
        status: "REJECTED",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/conversations
 * Admin only. Read-only. Returns list of all conversations with booking and participant info.
 * Sorted by lastMessageAt descending (most recent activity first).
 */
export async function getConversations(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const conversations = await Conversation.find({})
      .populate({
        path: "bookingId",
        select: "learnerId tutorId date startTime endTime status",
        populate: [
          { path: "learnerId", select: "name" },
          { path: "tutorId", select: "fullName" },
        ],
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    const list = conversations.map((conv) => {
      const booking = conv.bookingId;
      const messageCount = conv.messages?.length ?? 0;

      return {
        bookingId: booking?._id?.toString() ?? null,
        learnerName: booking?.learnerId?.name ?? "Unknown",
        learnerId: booking?.learnerId?._id?.toString() ?? null,
        tutorName: booking?.tutorId?.fullName ?? "Unknown",
        tutorId: booking?.tutorId?._id?.toString() ?? null,
        date: booking?.date ?? null,
        startTime: booking?.startTime ?? null,
        endTime: booking?.endTime ?? null,
        bookingStatus: booking?.status ?? null,
        messageCount,
        lastMessageAt: conv.lastMessageAt ?? conv.createdAt ?? null,
      };
    });

    return res.status(200).json({
      conversations: list,
      count: list.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/bookings/:bookingId/messages
 * Admin only. Read-only. Returns Conversation.messages for the booking (no socket).
 */
export async function getBookingMessages(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { bookingId } = req.params;
    const conversation = await Conversation.findOne({ bookingId })
      .select("bookingId messages lastMessageAt")
      .lean();

    const messages = (conversation?.messages ?? []).map((m) => ({
      id: m._id.toString(),
      bookingId: conversation.bookingId?.toString() ?? bookingId,
      senderId: m.senderId?.toString() ?? null,
      senderRole: m.senderRole ?? null,
      message: m.message ?? "",
      timestamp: m.timestamp ?? null,
    }));

    return res.status(200).json({
      bookingId,
      count: messages.length,
      messages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/reported-reviews
 * Admin only. Returns reviews where isReported === true.
 * Includes: rating, reviewText, tutor (name + id), learner (name + id), bookingId, reportedReason, reportedAt.
 */
export async function getReportedReviews(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const reviews = await Review.find({ isReported: true })
      .select(
        "bookingId tutorId learnerId rating reviewText createdAt reportedReason reportedAt",
      )
      .populate("tutorId", "fullName")
      .populate("learnerId", "name")
      .lean()
      .sort({ reportedAt: -1 });

    const items = reviews.map((r) => ({
      id: r._id.toString(),
      bookingId: r.bookingId.toString(),
      tutorId: r.tutorId?._id?.toString() ?? r.tutorId?.toString() ?? null,
      tutorName: r.tutorId?.fullName ?? "—",
      learnerId:
        r.learnerId?._id?.toString() ?? r.learnerId?.toString() ?? null,
      learnerName: r.learnerId?.name ?? "—",
      rating: r.rating,
      reviewText: r.reviewText ?? "",
      createdAt: r.createdAt,
      reportedReason: r.reportedReason ?? null,
      reportedAt: r.reportedAt ?? null,
    }));

    return res.status(200).json({
      count: items.length,
      reportedReviews: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/disputes
 * Admin only. Returns list of disputes (OPEN first, then RESOLVED).
 */
export async function getDisputes(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const disputes = await Dispute.find({})
      .populate("bookingId", "date startTime endTime status")
      .populate("learnerId", "name email")
      .populate("tutorId", "fullName")
      .sort({ status: 1, createdAt: -1 })
      .lean();

    const items = disputes.map((d) => ({
      id: d._id.toString(),
      bookingId:
        d.bookingId?._id?.toString() ?? d.bookingId?.toString() ?? null,
      date: d.bookingId?.date ?? null,
      startTime: d.bookingId?.startTime ?? null,
      endTime: d.bookingId?.endTime ?? null,
      learnerName: d.learnerId?.name ?? "—",
      tutorName: d.tutorId?.fullName ?? "—",
      status: d.status,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({ disputes: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/disputes/:disputeId
 * Admin only. Returns full dispute detail for review and resolution.
 */
export async function getDisputeById(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const dispute = await Dispute.findById(req.params.disputeId)
      .populate("bookingId")
      .populate("learnerId", "name email")
      .populate("tutorId", "fullName")
      .lean();

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    const bookingId = dispute.bookingId?._id ?? dispute.bookingId;
    const walletEntry = await TutorEarnings.findOne({ bookingId }).lean();
    const amountInPaise = walletEntry?.amount ?? null;

    const booking = dispute.bookingId;
    return res.status(200).json({
      id: dispute._id.toString(),
      bookingId: booking?._id?.toString() ?? null,
      status: dispute.status,
      learnerEvidence: dispute.learnerEvidence ?? null,
      tutorEvidence: dispute.tutorEvidence ?? null,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt ?? null,
      outcome: dispute.outcome ?? null,
      refundAmountInPaise: dispute.refundAmountInPaise ?? null,
      booking: booking
        ? {
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            learnerName: dispute.learnerId?.name ?? "—",
            learnerEmail: dispute.learnerId?.email ?? null,
            tutorName: dispute.tutorId?.fullName ?? "—",
          }
        : null,
      amountInPaise,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/disputes/:disputeId/resolve
 * Admin only. Resolve a dispute. Decision is final.
 * Body: { outcome: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RELEASE_PAYMENT_TO_TUTOR', refundAmountInPaise?: number }
 */
export async function resolveDisputeHandler(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { disputeId } = req.params;
    const { outcome, refundAmountInPaise } = req.body ?? {};

    const dispute = await resolveDispute({
      disputeId,
      outcome,
      refundAmountInPaise,
      adminId: req.user._id.toString(),
    });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "DISPUTE_RESOLVED",
      entityType: "Dispute",
      entityId: dispute._id,
      metadata: {
        bookingId:
          dispute.bookingId?.toString?.() ?? dispute.bookingId?.toString(),
        outcome: dispute.outcome,
        refundAmountInPaise: dispute.refundAmountInPaise ?? null,
      },
    });

    return res.status(200).json({
      message: "Dispute resolved successfully",
      dispute: {
        id: dispute._id.toString(),
        bookingId: dispute.bookingId.toString(),
        status: dispute.status,
        outcome: dispute.outcome,
        refundAmountInPaise: dispute.refundAmountInPaise ?? null,
        resolvedAt: dispute.resolvedAt,
      },
    });
  } catch (err) {
    if (err instanceof DisputeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/admin/config
 * Admin only. Read-only. Returns platform config (commissionRate, updatedAt).
 * Returns defaults if no config document exists yet.
 */
export async function getConfig(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const config = await PlatformConfig.findOne()
      .select("commissionRate updatedAt")
      .lean();

    const payload = config
      ? {
          commissionRate: config.commissionRate ?? 0,
          updatedAt: config.updatedAt ?? null,
        }
      : {
          commissionRate: 0,
          updatedAt: null,
        };

    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/config
 * Admin only. Updates platform config. Body: { commissionRate? }.
 * Changes are audit-logged (CONFIG_UPDATED).
 */
export async function updateConfig(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { commissionRate } = req.body ?? {};
    const update = { updatedAt: new Date() };

    if (typeof commissionRate === "number") {
      if (commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({
          message: "commissionRate must be between 0 and 100",
        });
      }
      update.commissionRate = commissionRate;
    }

    if (Object.keys(update).length === 1) {
      return res.status(400).json({
        message: "Provide commissionRate to update",
      });
    }

    const config = await PlatformConfig.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    )
      .select("commissionRate updatedAt")
      .lean();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "CONFIG_UPDATED",
      entityType: "Config",
      entityId: config._id,
      metadata: {
        commissionRate: config.commissionRate,
      },
    });

    return res.status(200).json({
      message: "Config updated successfully",
      config: {
        commissionRate: config.commissionRate ?? 0,
        updatedAt: config.updatedAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/audit-log
 * Admin only. Read-only list of admin audit log entries (admin actions, entity affected, timestamp).
 */
export async function getAuditLog(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const entries = await AdminAuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const items = entries.map((e) => ({
      id: e._id.toString(),
      adminId: e.adminId?.toString() ?? null,
      tutorId: e.tutorId?.toString() ?? null,
      documentId: e.documentId?.toString() ?? null,
      action: e.action ?? null,
      entityType: e.entityType ?? null,
      entityId: e.entityId?.toString() ?? null,
      metadata: e.metadata ?? {},
      createdAt: e.createdAt ?? null,
    }));

    return res.status(200).json({
      count: items.length,
      entries: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support/tickets
 * Admin only. Optional filter by ?status=OPEN|IN_PROGRESS|CLOSED.
 * Sorted by lastMessageAt desc (fallback to createdAt when null).
 */
export async function getSupportTickets(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { status } = req.query ?? {};
    const filter = {};
    if (status && ["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ tickets });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support/tickets/:ticketId
 * Admin only. Returns full ticket with messages.
 */
export async function getSupportTicketById(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { ticketId } = req.params;
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support/tickets/:ticketId/messages
 * Admin only. Appends an admin reply and updates lastMessageAt.
 * If current status is OPEN, it is set to IN_PROGRESS.
 */
export async function replyToSupportTicket(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { ticketId } = req.params;
    const { message } = req.body ?? {};

    // Validate message
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 5000) {
      return res
        .status(400)
        .json({ message: "Message must be at most 5000 characters" });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Prevent replying to CLOSED ticket
    if (ticket.status === "CLOSED") {
      return res
        .status(400)
        .json({ message: "Cannot reply to a closed ticket" });
    }

    const previousStatus = ticket.status;
    const now = new Date();
    const updateData = {
      $push: {
        messages: {
          senderUserId: req.user._id,
          senderRole: "ADMIN",
          message: trimmedMessage,
          createdAt: now,
        },
      },
      $set: {
        lastMessageAt: now,
      },
    };

    // If status is OPEN, set to IN_PROGRESS
    if (ticket.status === "OPEN") {
      updateData.$set.status = "IN_PROGRESS";
    }

    // Use MongoDB $push for atomic append operation
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    // Log status change if it occurred
    if (previousStatus !== updatedTicket.status) {
      await AdminAuditLog.create({
        adminId: req.user._id,
        action: "SUPPORT_TICKET_STATUS_CHANGED",
        entityType: "SupportTicket",
        entityId: updatedTicket._id,
        metadata: {
          previousStatus,
          newStatus: updatedTicket.status,
        },
      });
    }

    return res.status(201).json({
      message: "Admin reply added to ticket",
      ticket: updatedTicket,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support/tickets/:ticketId/status
 * Admin only. Allows setting status to IN_PROGRESS or CLOSED.
 * Logs status changes in AdminAuditLog.
 */
export async function updateSupportTicketStatus(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const { ticketId } = req.params;
    const { status } = req.body ?? {};

    if (!["IN_PROGRESS", "CLOSED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be IN_PROGRESS or CLOSED",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const previousStatus = ticket.status;
    if (previousStatus === status) {
      return res.status(200).json({
        message: "Status unchanged",
        ticket,
      });
    }

    ticket.status = status;
    await ticket.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "SUPPORT_TICKET_STATUS_CHANGED",
      entityType: "SupportTicket",
      entityId: ticket._id,
      metadata: {
        previousStatus,
        newStatus: status,
      },
    });

    return res.status(200).json({
      message: "Support ticket status updated",
      ticket,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/notifications/broadcast
 * Admin only. Sends a notification to all users (Learner and Tutor; excludes Admin).
 * Body: { title: string, message: string }
 */
export async function broadcastNotification(req, res, next) {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied: Admin role required",
      });
    }

    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const message =
      typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!title || !message) {
      return res.status(400).json({
        message: "Both title and message are required",
      });
    }

    const users = await User.find({
      role: { $in: ["Learner", "Tutor"] },
      status: "ACTIVE",
    })
      .select("_id")
      .lean();

    const bulk = users.map((u) => ({
      insertOne: {
        document: {
          userId: u._id,
          type: "admin_broadcast",
          title,
          message,
          data: null,
          read: false,
        },
      },
    }));

    if (bulk.length === 0) {
      return res.status(200).json({
        message: "Broadcast sent (no active learners or tutors)",
        count: 0,
      });
    }

    await Notification.bulkWrite(bulk);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: "NOTIFICATION_BROADCAST",
      entityType: "Notification",
      entityId: new mongoose.Types.ObjectId(),
      metadata: { title, message, recipientCount: users.length },
    });

    return res.status(200).json({
      message: "Broadcast sent to all learners and tutors",
      count: users.length,
    });
  } catch (err) {
    next(err);
  }
}
