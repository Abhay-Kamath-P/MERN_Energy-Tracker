import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import machineRoutes from './routes/machineRoutes.js';
import energyLogRoutes from './routes/energyLogRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import User from './models/User.js';
import { seedData } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Automatically seed if the database has 0 users
const userCount = await User.countDocuments();
if (userCount === 0) {
  console.log('[Auto-Init] No existing users found. Seeding initial factory data...');
  await seedData();
  console.log('[Auto-Init] Initial seed complete.');
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/logs', energyLogRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Factory Energy Tracking System API',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ Factory Energy Tracker API is running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
