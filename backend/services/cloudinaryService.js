import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// TODO: CLARIFICATION REQUIRED - Should we replace Cloudinary with AWS S3 in Phase 3?
// This service is isolated to make future migration easier
export const uploadImage = async (fileBuffer, folder = 'profile-photos') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        // No transformations as per requirements
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// TODO: Future implementation - AWS S3 replacement
// export const uploadImageToS3 = async (fileBuffer, fileName) => {
//   // Implementation for AWS S3
// };
