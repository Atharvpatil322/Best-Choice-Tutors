import Tutor from '../models/Tutor.js';
import DBSVerificationDocument from '../models/DBSVerificationDocument.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { uploadDbsCertificate, presignDocumentUrl } from '../services/s3Service.js';

/**
 * Resolve tutor profile for the authenticated user.
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<import('mongoose').Document|null>}
 */
const getTutorByUserId = async (userId) => {
  return Tutor.findOne({ userId }).lean();
};

/**
 * GET /api/tutor/dbs-documents
 * Tutor only. Read-only list of the authenticated tutor's DBS documents.
 */
export async function getMyDbsDocuments(req, res, next) {
  try {
    const userId = req.user._id;
    const tutor = await getTutorByUserId(userId);
    if (!tutor) {
      return res.status(403).json({
        message: 'Tutor profile not found. Create a tutor profile first.',
      });
    }

    const docs = await DBSVerificationDocument.find({ tutorId: tutor._id })
      .sort({ uploadedAt: -1 })
      .lean();

    const documents = await Promise.all(
      docs.map(async (d) => {
        const fileUrl = await presignDocumentUrl(d.fileUrl ?? '');
        return {
          id: d._id.toString(),
          tutorId: d.tutorId?.toString() ?? d.tutorId,
          fileName: d.fileName ?? '',
          fileType: d.fileType ?? null,
          fileUrl: fileUrl ?? '',
          storageKey: d.storageKey ?? '',
          status: d.status ?? 'PENDING',
          uploadedAt: d.uploadedAt,
        };
      })
    );

    return res.status(200).json({
      tutorId: tutor._id.toString(),
      count: documents.length,
      documents,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tutor/dbs-documents
 * Tutor only. Upload a DBS certificate (PDF or image). Uploads to cloud storage,
 * saves metadata in DBSVerificationDocument with status PENDING. Does not auto-verify tutor.
 */
export async function uploadDbsDocument(req, res, next) {
  try {
    const userId = req.user._id;
    const tutor = await getTutorByUserId(userId);
    if (!tutor) {
      return res.status(403).json({
        message: 'Tutor profile not found. Create a tutor profile first.',
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: 'No file uploaded. Send a single file (field name: document).',
      });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per document
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: 'File size must not exceed 5 MB per document.',
      });
    }

    const mimetype = req.file.mimetype;
    const fileType =
      mimetype === 'application/pdf' ? 'PDF' : mimetype.startsWith('image/') ? 'IMAGE' : null;
    if (!fileType) {
      return res.status(400).json({
        message: 'Only PDF or image files are allowed.',
      });
    }

    const { fileUrl, storageKey } = await uploadDbsCertificate(
      req.file.buffer,
      tutor._id.toString(),
      fileType
    );

    const fileName = (req.file.originalname || 'document').trim() || 'document';

    const doc = await DBSVerificationDocument.create({
      tutorId: tutor._id,
      fileName,
      fileType,
      fileUrl,
      storageKey,
      status: 'PENDING',
    });

    await AdminAuditLog.create({
      adminId: null,
      tutorId: tutor._id,
      documentId: doc._id,
      action: 'DBS_SUBMITTED',
      entityType: 'DBSVerificationDocument',
      entityId: doc._id,
      metadata: { fileName: doc.fileName ?? '' },
    });

    const presignedFileUrl = await presignDocumentUrl(doc.fileUrl);
    return res.status(201).json({
      message: 'DBS document uploaded.',
      document: {
        id: doc._id.toString(),
        tutorId: doc.tutorId.toString(),
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileUrl: presignedFileUrl ?? doc.fileUrl,
        storageKey: doc.storageKey,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
