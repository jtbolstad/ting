import type { Router as ExpressRouter } from "express";
import { Response, Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { withOrganizationContext } from "../middleware/organization.js";
import { processImage } from "../services/imageProcessor.js";
import { uploadMiddleware, validateFileType } from "../utils/upload.js";

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

export default router;
