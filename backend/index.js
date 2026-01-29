import http from 'http';
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
import tutorBookingsRoutes from './routes/tutorBookingsRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { attachSocketServer } from './services/socketService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server (required for Socket.IO)
const httpServer = http.createServer(app);

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
app.use('/api/tutor', tutorBookingsRoutes);
app.use('/api/user', userProfileRoutes);

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

// Attach Socket.IO for chat (booking-scoped, auth required)
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
attachSocketServer(httpServer, corsOrigin);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
