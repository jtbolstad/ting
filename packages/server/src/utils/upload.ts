import multer from 'multer';
import path from 'path';

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Magic number signatures for validation
const MAGIC_NUMBERS: { [key: string]: number[] } = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
};

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  
  // Remove or replace special characters, keep only alphanumeric, dash, underscore, dot
  const sanitized = basename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.') // Prevent multiple dots
    .replace(/^\.+/, ''); // Remove leading dots
  
  // Ensure we have a valid filename
  return sanitized || 'upload';
}

/**
 * Validate file type using magic number (file signature)
 * More secure than trusting MIME type alone
 */
export function validateFileType(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // Check JPEG signature
  if (
    buffer[0] === MAGIC_NUMBERS.jpeg[0] &&
    buffer[1] === MAGIC_NUMBERS.jpeg[1] &&
    buffer[2] === MAGIC_NUMBERS.jpeg[2]
  ) {
    return true;
  }

  // Check PNG signature
  if (
    buffer[0] === MAGIC_NUMBERS.png[0] &&
    buffer[1] === MAGIC_NUMBERS.png[1] &&
    buffer[2] === MAGIC_NUMBERS.png[2] &&
    buffer[3] === MAGIC_NUMBERS.png[3]
  ) {
    return true;
  }

  // Check GIF signature
  if (
    buffer[0] === MAGIC_NUMBERS.gif[0] &&
    buffer[1] === MAGIC_NUMBERS.gif[1] &&
    buffer[2] === MAGIC_NUMBERS.gif[2]
  ) {
    return true;
  }

  // Check WebP signature (RIFF....WEBP)
  if (
    buffer[0] === MAGIC_NUMBERS.webp[0] &&
    buffer[1] === MAGIC_NUMBERS.webp[1] &&
    buffer[2] === MAGIC_NUMBERS.webp[2] &&
    buffer[3] === MAGIC_NUMBERS.webp[3] &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return true;
  }

  return false;
}

/**
 * File filter for multer - validates MIME type
 */
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_MIME_TYPES.join(', ')} are allowed.`
      )
    );
  }
};

/**
 * Configure multer for image uploads
 * Uses memory storage for immediate processing with Sharp
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
