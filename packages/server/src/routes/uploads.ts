import fs from "node:fs/promises";
import path from "node:path";
import type { Router as ExpressRouter } from "express";
import { Response, Router } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { withOrganizationContext } from "../middleware/organization.js";
import { processImage } from "../services/imageProcessor.js";
import { sanitizeFilename, uploadMiddleware, validateFileType } from "../utils/upload.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
const UPLOAD_BASE_DIR = IS_PRODUCTION ? path.join("/var/data", "uploads") : path.join(process.cwd(), "uploads");

const pdfMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Kun PDF-filer er tillatt'));
  },
});

const router: ExpressRouter = Router();

/**
 * POST /api/uploads/image
 * Upload and process an image for an item
 *
 * Requires authentication and organization context
 * Accepts multipart/form-data with 'image' field
 * Returns { url, thumbnail }
 */
router.post(
  "/image",
  authenticate,
  withOrganizationContext(),
  uploadMiddleware.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate file type using magic number
      if (!validateFileType(req.file.buffer)) {
        return res.status(400).json({
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        });
      }

      // Get organization ID from middleware
      const organizationId = req.organization!.id;

      // Process image (resize, convert to WebP, generate thumbnail)
      const result = await processImage(
        req.file.buffer,
        organizationId,
        req.file.originalname,
      );

      console.log(`✅ Image uploaded successfully:`, result);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Image upload error:", error);

      // Handle specific multer errors
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          return res
            .status(413)
            .json({ error: "File size exceeds 10MB limit" });
        }
        if (error.message.includes("Invalid file type")) {
          return res.status(400).json({ error: error.message });
        }
      }

      return res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

/**
 * POST /api/uploads/manual
 * Upload a PDF manual for an item
 * Returns { url: string }
 */
router.post(
  "/manual",
  authenticate,
  withOrganizationContext(),
  pdfMiddleware.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Ingen fil lastet opp" });

      // Validate PDF magic bytes (%PDF)
      if (
        req.file.buffer[0] !== 0x25 ||
        req.file.buffer[1] !== 0x50 ||
        req.file.buffer[2] !== 0x44 ||
        req.file.buffer[3] !== 0x46
      ) {
        return res.status(400).json({ error: "Filen er ikke en gyldig PDF" });
      }

      const organizationId = req.organization!.id;
      const orgDir = path.join(UPLOAD_BASE_DIR, organizationId, "manuals");
      await fs.mkdir(orgDir, { recursive: true });

      const sanitized = sanitizeFilename(req.file.originalname);
      const filename = `${Date.now()}-${sanitized.replace(/\.pdf$/i, '')}.pdf`;
      const filePath = path.join(orgDir, filename);
      await fs.writeFile(filePath, req.file.buffer);

      const url = `/uploads/${organizationId}/manuals/${filename}`;
      return res.status(200).json({ url });
    } catch (error) {
      console.error("PDF upload error:", error);
      if (error instanceof Error && error.message.includes("Kun PDF")) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Kunne ikke laste opp PDF" });
    }
  },
);

export default router;
