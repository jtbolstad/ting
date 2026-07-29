import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import commentsRoutes from "./routes/comments.js";
import itemsRoutes from "./routes/items.js";
import loansRoutes from "./routes/loans.js";
import locationsRoutes from "./routes/locations.js";
import organizationsRoutes from "./routes/organizations.js";
import reservationsRoutes from "./routes/reservations.js";
import reviewsRoutes from "./routes/reviews.js";
import uploadsRoutes from "./routes/uploads.js";
import usersRoutes from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3001;
// Check if client dist directory exists to determine if we're in production
const clientDistPath = path.join(__dirname, "..", "..", "..", "client", "dist");
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.RENDER === "true";
// Which deployment this is: production | stage | development.
// Stage runs with NODE_ENV=production, so IS_PRODUCTION cannot identify it.
const APP_ENV =
  process.env.APP_ENV || (IS_PRODUCTION ? "production" : "development");
const GIT_COMMIT = process.env.GIT_COMMIT || null;
const STARTED_AT = new Date().toISOString();

// Initialize server
async function startServer() {
  // Ensure uploads directory exists
  const UPLOADS_DIR =
    process.env.UPLOADS_DIR ||
    (IS_PRODUCTION
      ? path.join("/var/data", "uploads")
      : path.join(process.cwd(), "uploads"));
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);

  app.use(cors());
  app.use(express.json());

  // Keep non-production deployments out of search indexes. Stage is on a
  // public subdomain with a valid certificate, so it is crawlable otherwise.
  if (APP_ENV !== "production") {
    app.use((req, res, next) => {
      res.set("X-Robots-Tag", "noindex, nofollow");
      next();
    });
  }

  // Serve uploaded files statically - BEFORE other routes
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => {
        res.set("Cache-Control", "public, max-age=31536000");
      },
      fallthrough: true,
    }),
  );

  // Debug logging for upload requests in production
  if (IS_PRODUCTION) {
    app.use("/uploads", (req, res, next) => {
      console.log(`⚠️ Upload file not found: ${req.path}`);
      console.log(`   Looking in: ${UPLOADS_DIR}`);
      res.status(404).send("File not found");
    });
  }

  // API Routes
  app.use("/api/admin", adminRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/items", itemsRoutes);
  app.use("/api/reservations", reservationsRoutes);
  app.use("/api/loans", loansRoutes);
  app.use("/api/locations", locationsRoutes);
  app.use("/api/organizations", organizationsRoutes);
  app.use("/api/comments", commentsRoutes);
  app.use("/api/reviews", reviewsRoutes);
  app.use("/api/uploads", uploadsRoutes);

  // Health check — also used by the deploy workflows to verify which commit is live
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      env: APP_ENV,
      commit: GIT_COMMIT,
      startedAt: STARTED_AT,
    });
  });

  // Debug endpoint for checking uploads directory (non-production only —
  // it lists the contents of the uploads directory without authentication)
  app.get("/api/debug/uploads", async (req, res) => {
    if (APP_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      const files = await fs.readdir(UPLOADS_DIR, {
        recursive: true,
        withFileTypes: true,
      });
      const fileList = files
        .filter((f) => f.isFile())
        .map((f) =>
          path.join(f.path || f.parentPath, f.name).replace(UPLOADS_DIR, ""),
        );

      res.json({
        uploadsDir: UPLOADS_DIR,
        totalFiles: fileList.length,
        files: fileList.slice(0, 20), // First 20 files
        diskMounted: await fs
          .access(UPLOADS_DIR)
          .then(() => true)
          .catch(() => false),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message, uploadsDir: UPLOADS_DIR });
    }
  });

  // In production, serve the built client app
  if (IS_PRODUCTION) {
    app.use(express.static(clientDistPath));

    // Serve index.html for all non-API/non-upload routes (SPA fallback)
    // This must NOT catch /api/* or /uploads/* routes
    app.get("*", (req, res, next) => {
      // Skip SPA fallback for API and upload routes
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(
      `📦 Environment: ${APP_ENV}${GIT_COMMIT ? ` (${GIT_COMMIT})` : ""}`,
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
