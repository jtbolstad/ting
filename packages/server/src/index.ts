import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import commentsRoutes from "./routes/comments.js";
import itemsRoutes from "./routes/items.js";
import loansRoutes from "./routes/loans.js";
import organizationsRoutes from "./routes/organizations.js";
import reservationsRoutes from "./routes/reservations.js";
import reviewsRoutes from "./routes/reviews.js";
import uploadsRoutes from "./routes/uploads.js";
import usersRoutes from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Initialize server
async function startServer() {
  // Ensure uploads directory exists
  const UPLOADS_DIR = IS_PRODUCTION
    ? path.join("/var/data", "uploads")
    : path.join(process.cwd(), "uploads");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/items", itemsRoutes);
  app.use("/api/reservations", reservationsRoutes);
  app.use("/api/loans", loansRoutes);
  app.use("/api/organizations", organizationsRoutes);
  app.use("/api/comments", commentsRoutes);
  app.use("/api/reviews", reviewsRoutes);
  app.use("/api/uploads", uploadsRoutes);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In production, serve the built client app
  if (IS_PRODUCTION) {
    const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");
    app.use(express.static(clientDistPath));

    // Serve index.html for all non-API routes (SPA fallback)
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(
      `📦 Environment: ${IS_PRODUCTION ? "production" : "development"}`,
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
