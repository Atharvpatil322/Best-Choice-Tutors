import multer from 'multer';

// Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Tutor verification documents: PDF or image only (does not affect profile photo)
// Max 5 MB per file (per document, not cumulative)
const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const certificateFileFilter = (req, file, cb) => {
  const allowed = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or image files are allowed'), false);
  }
};

export const uploadCertificate = multer({
  storage: storage,
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
  },
  fileFilter: certificateFileFilter,
});

// DBS documents: PDF or image only, same 5 MB limit (does not affect profile or qualification uploads)
export const uploadDbsCertificate = multer({
  storage: storage,
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
  },
  fileFilter: certificateFileFilter,
});
