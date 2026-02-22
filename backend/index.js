import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import learnerProfileRoutes from './routes/learnerProfileRoutes.js';
import learnerBookingsRoutes from './routes/learnerBookingsRoutes.js';
import tuitionRequestRoutes from './routes/tuitionRequestRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import tutorProfileRoutes from './routes/tutorProfileRoutes.js';
import tutorBookingsRoutes from './routes/tutorBookingsRoutes.js';
import tutorTuitionRequestRoutes from './routes/tutorTuitionRequestRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { attachSocketServer } from './services/socketService.js';
import { completeEligibleBookings } from './services/bookingService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      // Keep raw body for webhook signature verification (Stripe)
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/learner', learnerProfileRoutes);
app.use('/api/learner', learnerBookingsRoutes);
app.use('/api/learner', tuitionRequestRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/tutor', tutorProfileRoutes);
app.use('/api/tutor', tutorBookingsRoutes);
app.use('/api/tutor', tutorTuitionRequestRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});


// 1. Serve static files from the frontend 'dist' folder
// This assumes your frontend build command creates a 'dist' folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. Handle any requests that aren't API calls by serving index.html
// This allows React Router to work properly
app.get('*', (req, res, next) => {
  // If the request is for an API, don't serve the index.html
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
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

// Booking completion: PAID → COMPLETED after session end + buffer (simple time-based check)
const COMPLETION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const runCompletionCheck = async () => {
  try {
    const { updated } = await completeEligibleBookings();
    if (updated > 0) {
      console.log(`Booking completion: marked ${updated} booking(s) as COMPLETED`);
    }
  } catch (err) {
    console.error('Booking completion check failed:', err.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  runCompletionCheck();
  setInterval(runCompletionCheck, COMPLETION_CHECK_INTERVAL_MS);
});
