import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import itemsRoutes from './routes/items.js';
import reservationsRoutes from './routes/reservations.js';
import loansRoutes from './routes/loans.js';
import organizationsRoutes from './routes/organizations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/organizations', organizationsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
