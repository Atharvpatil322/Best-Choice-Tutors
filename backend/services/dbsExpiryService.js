import Tutor from '../models/Tutor.js';
import DBSVerificationDocument from '../models/DBSVerificationDocument.js';
import Notification from '../models/Notification.js';

const DBS_EXPIRED_NOTIFICATION_MESSAGE =
  'Your DBS verification has expired. Please upload updated documents to regain verified status.';

/**
 * Weekly DBS expiry handler.
 *
 * - Finds DBSVerificationDocuments that were approved (isVerified=true) and have expiryDate < now
 * - Marks those documents as unverified and disables the tutor's DBS badge flag
 * - Sends exactly one notification per expired document (idempotent via expiredNotifiedAt)
 *
 * UTC comparisons only: Mongo stores Date in UTC and we compare with `new Date()`.
 */
export async function runDbsExpiryCheck() {
  const now = new Date();
  if (Number.isNaN(now.getTime())) return;

  // For correctness with multiple documents per tutor, we treat the most recently verified document as active.
  const pipeline = [
    {
      $match: {
        isVerified: true,
        expiryDate: { $type: 'date', $lt: now },
      },
    },
    { $sort: { tutorId: 1, verifiedAt: -1, _id: -1 } },
    {
      $group: {
        _id: '$tutorId',
        documentId: { $first: '$_id' },
        expiryDate: { $first: '$expiryDate' },
      },
    },
    {
      $project: {
        tutorId: '$_id',
        documentId: 1,
        expiryDate: 1,
        _id: 0,
      },
    },
  ];

  const cursor = DBSVerificationDocument.aggregate(pipeline).cursor({
    batchSize: 200,
  });

  let processed = 0;
  let notified = 0;

  for await (const item of cursor) {
    processed += 1;
    const tutorId = item.tutorId;
    const documentId = item.documentId;
    const expiryDate = item.expiryDate;

    if (!tutorId || !documentId || !expiryDate) continue;
    if (Number.isNaN(new Date(expiryDate).getTime())) continue; // Defensive: skip invalid dates

    // Idempotency: if this doc was already expired/notified, skip.
    const expiredDoc = await DBSVerificationDocument.findOneAndUpdate(
      {
        _id: documentId,
        tutorId,
        isVerified: true,
        expiryDate: { $lt: now },
        expiredNotifiedAt: null,
      },
      {
        $set: {
          isVerified: false,
          expiredAt: now,
          expiredNotifiedAt: now,
        },
      },
      { new: true, lean: true },
    );

    if (!expiredDoc) continue;

    // Disable the DBS badge on the tutor (skip notification if tutor already unverified).
    const tutorUpdate = await Tutor.updateOne(
      { _id: tutorId, isDbsVerified: true },
      { $set: { isDbsVerified: false } },
    );
    const tutorModified =
      tutorUpdate.modifiedCount != null ? tutorUpdate.modifiedCount : 0;

    if (tutorModified > 0 && expiredDoc?.tutorId) {
      // Resolve User id for in-app notifications.
      const tutorUser = await Tutor.findById(tutorId)
        .select('userId')
        .lean();
      const userId = tutorUser?.userId;
      if (userId) {
        await Notification.create({
          userId,
          type: 'dbs_expired',
          title: 'DBS verification expired',
          message: DBS_EXPIRED_NOTIFICATION_MESSAGE,
          data: {
            tutorId: tutorId.toString(),
            dbsDocumentId: documentId.toString(),
            expiryDate: new Date(expiryDate).toISOString(),
          },
          read: false,
        });
        notified += 1;
      }
    }
  }

  console.info('DBS expiry check completed', { processed, notified });
}

