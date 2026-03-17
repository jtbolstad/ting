import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sanitizeFilename } from "../utils/upload.js";

// Image processing configuration
const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 300;
const WEBP_QUALITY = 85;

// Base upload directory - use /var/data in production for Render persistent disk
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.RENDER === "true";
const UPLOAD_BASE_DIR = IS_PRODUCTION
  ? path.join("/var/data", "uploads")
  : path.join(process.cwd(), "uploads");

export interface ProcessedImage {
  url: string;
  thumbnail: string;
}

/**
 * Ensure upload directory exists for organization
 */
async function ensureUploadDirectory(organizationId: string): Promise<string> {
  const orgDir = path.join(UPLOAD_BASE_DIR, organizationId);

  try {
    await fs.mkdir(orgDir, { recursive: true });
    console.log(`✓ Upload directory ready: ${orgDir}`);
  } catch (error) {
    console.error(`✗ Failed to create upload directory ${orgDir}:`, error);
    throw new Error(`Failed to create upload directory: ${error}`);
  }

  return orgDir;
}

/**
 * Generate unique filename with timestamp
 */
function generateFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, "");
  const timestamp = Date.now();

  return `${timestamp}-${nameWithoutExt}.webp`;
}

/**
 * Process uploaded image: resize, convert to WebP, generate thumbnail
 *
 * @param buffer - Image buffer from multer
 * @param organizationId - Organization ID for directory isolation
 * @param originalFilename - Original filename from upload
 * @returns URLs for main image and thumbnail
 */
export async function processImage(
  buffer: Buffer,
  organizationId: string,
  originalFilename: string,
): Promise<ProcessedImage> {
  try {
    // Ensure upload directory exists
    const orgDir = await ensureUploadDirectory(organizationId);

    // Generate unique filename
    const filename = generateFilename(originalFilename);
    const thumbnailFilename = filename.replace(".webp", "-thumb.webp");

    // Full paths
    const mainPath = path.join(orgDir, filename);
    const thumbnailPath = path.join(orgDir, thumbnailFilename);

    // Process main image: resize and convert to WebP
    await sharp(buffer)
      .resize(MAX_WIDTH, null, {
        width: MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(mainPath);

    // Generate thumbnail
    await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, null, {
        width: THUMBNAIL_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbnailPath);

    // Return relative URLs for serving via Express static
    return {
      url: `/uploads/${organizationId}/${filename}`,
      thumbnail: `/uploads/${organizationId}/${thumbnailFilename}`,
    };
  } catch (error) {
    throw new Error(`Failed to process image: ${error}`);
  }
}

/**
 * Delete image files from filesystem
 * Used when deleting items or replacing images
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from URL (e.g., /uploads/orgId/file.webp -> uploads/orgId/file.webp)
    const relativePath = imageUrl.startsWith("/")
      ? imageUrl.slice(1)
      : imageUrl;
    const fullPath = path.join(process.cwd(), relativePath);

    // Delete main image
    await fs.unlink(fullPath);

    // Delete thumbnail if exists
    const thumbnailPath = fullPath.replace(".webp", "-thumb.webp");
    try {
      await fs.unlink(thumbnailPath);
    } catch {
      // Thumbnail might not exist, ignore error
    }
  } catch (error) {
    // Log but don't throw - file might already be deleted or not exist
    console.error(`Failed to delete image ${imageUrl}:`, error);
  }
}
