import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import itemsRoutes from './routes/items.js';
import reservationsRoutes from './routes/reservations.js';
import loansRoutes from './routes/loans.js';
import organizationsRoutes from './routes/organizations.js';
import commentsRoutes from './routes/comments.js';
import uploadsRoutes from './routes/uploads.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize server
async function startServer() {
  // Ensure uploads directory exists
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/reservations', reservationsRoutes);
  app.use('/api/loans', loansRoutes);
  app.use('/api/organizations', organizationsRoutes);
  app.use('/api/comments', commentsRoutes);
  app.use('/api/uploads', uploadsRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
