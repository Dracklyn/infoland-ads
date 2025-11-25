import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDatabase } from './db/database.js';
import { authRoutes } from './routes/auth.js';
import { adsRoutes } from './routes/ads.js';
import { apiRoutes } from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin interface
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/integration', apiRoutes);

// Serve admin interface for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Ads Management Terminal running on http://localhost:${PORT}`);
    console.log(`📱 Admin interface: http://localhost:${PORT}`);
    console.log(`🔌 API endpoint: http://localhost:${PORT}/api/integration/ads`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

