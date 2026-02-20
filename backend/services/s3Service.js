import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const bucket = process.env.AWS_BUCKET_NAME;
// Use access point ARN for uploads if set (e.g. when bucket has ACLs disabled and you use an access point)
const accessPointArn = process.env.AWS_S3_ACCESS_POINT_ARN;
const bucketOrAccessPoint = accessPointArn || bucket;
// Region must match the bucket's region (e.g. ap-south-1 for Mumbai). Wrong region causes PermanentRedirect.
const region = process.env.AWS_REGION || process.env.AWS_S3_REGION || 'us-east-1';

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_PUBLIC_URL_PREFIX = bucket
  ? `https://${bucket}.s3.${region}.amazonaws.com/`
  : '';

/**
 * Get public URL for an S3 object (bucket must allow public read or use bucket policy).
 * @param {string} key - S3 object key
 * @returns {string}
 */
function getPublicUrl(key) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * If the given URL is our S3 bucket URL, return a presigned GET URL (valid 1 hour) so the image can be read without public ACL.
 * Otherwise return the URL unchanged (e.g. external URLs like Google profile photos).
 * @param {string | null | undefined} url - Stored profile photo URL
 * @returns {Promise<string | null>}
 */
export async function presignProfilePhotoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!S3_PUBLIC_URL_PREFIX || !url.startsWith(S3_PUBLIC_URL_PREFIX)) return url;
  const key = url.slice(S3_PUBLIC_URL_PREFIX.length);
  if (!key) return url;
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch {
    return url;
  }
}

/**
 * Presign a document URL (tutor certificate, DBS certificate, etc.) for read access.
 * If the URL is our S3 bucket URL, returns a presigned GET URL (valid 1 hour). Otherwise returns unchanged.
 * @param {string | null | undefined} url - Stored document URL (e.g. fileUrl from TutorVerificationDocument)
 * @returns {Promise<string | null>}
 */
export async function presignDocumentUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!S3_PUBLIC_URL_PREFIX || !url.startsWith(S3_PUBLIC_URL_PREFIX)) return url;
  const key = url.slice(S3_PUBLIC_URL_PREFIX.length);
  if (!key) return url;
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch {
    return url;
  }
}

/**
 * Delete an S3 object by its stored public URL. Only deletes if the URL belongs to our bucket.
 * No-op if url is null/undefined or not our S3 URL (e.g. external Google photo). Swallows errors.
 * @param {string | null | undefined} url - Stored profile photo URL
 * @returns {Promise<void>}
 */
export async function deleteProfilePhotoByUrl(url) {
  if (!url || typeof url !== 'string') return;
  if (!S3_PUBLIC_URL_PREFIX || !url.startsWith(S3_PUBLIC_URL_PREFIX)) return;
  const key = url.slice(S3_PUBLIC_URL_PREFIX.length);
  if (!key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error('S3 delete profile photo failed (key=%s):', key, err.message);
  }
}

/**
 * Upload a buffer to S3 with a unique key and return the public URL.
 * @param {Buffer} fileBuffer
 * @param {string} key - S3 object key (e.g. folder/filename)
 * @param {string} [contentType] - MIME type
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadToS3(fileBuffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucketOrAccessPoint,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  // Do not set ACL: buckets with "Object ownership: Bucket owner enforced" do not allow ACLs (AccessControlListNotSupported)
  await s3Client.send(command);
  return getPublicUrl(key);
}

/**
 * Upload a profile/image file.
 * @param {Buffer} fileBuffer - File contents
 * @param {string} [folder='profile-photos'] - Logical folder (S3 prefix)
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadImage = async (fileBuffer, folder = 'profile-photos') => {
  const ext = 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;
  const url = await uploadToS3(fileBuffer, key, 'image/jpeg');
  return url;
};

/**
 * Upload a tutor verification document (PDF or image).
 * Stores under prefix: tutor-certificates/ (all documents at same level).
 * @param {Buffer} fileBuffer - File contents
 * @param {string} tutorId - Unused; kept for API compatibility. Tutor association is in DB.
 * @param {'PDF' | 'IMAGE'} fileType - PDF or IMAGE
 * @returns {Promise<{ fileUrl: string, storageKey: string }>}
 */
export const uploadTutorCertificate = async (fileBuffer, tutorId, fileType) => {
  const folder = 'tutor-certificates';
  const ext = fileType === 'PDF' ? 'pdf' : 'jpg';
  const contentType = fileType === 'PDF' ? 'application/pdf' : 'image/jpeg';
  const key = `${folder}/${randomUUID()}.${ext}`;
  const fileUrl = await uploadToS3(fileBuffer, key, contentType);
  return { fileUrl, storageKey: key };
};

/**
 * Upload a DBS verification document (PDF or image).
 * Stores under prefix: tutor-dbs/ (all documents at same level).
 * @param {Buffer} fileBuffer - File contents
 * @param {string} tutorId - Unused; kept for API compatibility. Tutor association is in DB.
 * @param {'PDF' | 'IMAGE'} fileType - PDF or IMAGE
 * @returns {Promise<{ fileUrl: string, storageKey: string }>}
 */
export const uploadDbsCertificate = async (fileBuffer, tutorId, fileType) => {
  const folder = 'tutor-dbs';
  const ext = fileType === 'PDF' ? 'pdf' : 'jpg';
  const contentType = fileType === 'PDF' ? 'application/pdf' : 'image/jpeg';
  const key = `${folder}/${randomUUID()}.${ext}`;
  const fileUrl = await uploadToS3(fileBuffer, key, contentType);
  return { fileUrl, storageKey: key };
};
