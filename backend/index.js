import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import learnerProfileRoutes from './routes/learnerProfileRoutes.js';
import learnerBookingsRoutes from './routes/learnerBookingsRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import tutorProfileRoutes from './routes/tutorProfileRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Keep a copy of the raw body for webhook signature verification
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/learner', learnerProfileRoutes);
app.use('/api/learner', learnerBookingsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/tutor', tutorProfileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
