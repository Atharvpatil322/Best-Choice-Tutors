import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import learnerProfileRoutes from "./routes/learnerProfileRoutes.js";
import learnerBookingsRoutes from "./routes/learnerBookingsRoutes.js";
import tuitionRequestRoutes from "./routes/tuitionRequestRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import tutorProfileRoutes from "./routes/tutorProfileRoutes.js";
import tutorBookingsRoutes from "./routes/tutorBookingsRoutes.js";
import tutorTuitionRequestRoutes from "./routes/tutorTuitionRequestRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicAssetsRoutes from "./routes/publicAssetsRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { attachSocketServer } from "./services/socketService.js";
import { completeEligibleBookings } from "./services/bookingService.js";
import { runDbsExpiryCheck } from "./services/dbsExpiryService.js";
import { logTransactionalEmailStatus } from "./services/emailService.js";
import path from "path";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load environment variables from this package directory (not process.cwd()),
// so email/DB secrets work when the app is started from the monorepo root.
dotenv.config({ path: path.join(__dirname, ".env") });
logTransactionalEmailStatus();

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
  }),
);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/learner", learnerProfileRoutes);
app.use("/api/learner", learnerBookingsRoutes);
app.use("/api/learner", tuitionRequestRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/tutor", tutorProfileRoutes);
app.use("/api/tutor", tutorBookingsRoutes);
app.use("/api/tutor", tutorTuitionRequestRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/public", publicAssetsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const frontendDist = path.join(__dirname, "../frontend/dist");

// Production: serve built SPA. Order matters — never register a JSON 404 *before* the SPA fallback
// or full-page reloads on /dashboard, /tutor, etc. will not receive index.html (blank / non-HTML body).
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/socket.io")
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Unmatched routes (unknown API paths, etc.)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

// Attach Socket.IO for chat (booking-scoped, auth required)
const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
attachSocketServer(httpServer, corsOrigin);

// Booking completion: PAID → COMPLETED after session end + buffer (simple time-based check)
const COMPLETION_CHECK_INTERVAL_MS = 10 * 1000; // 10 seconds (use 5 * 60 * 1000 for production)

const runCompletionCheck = async () => {
  try {
    const { updated } = await completeEligibleBookings();
    if (updated > 0) {
      console.log(
        `Booking completion: marked ${updated} booking(s) as COMPLETED`,
      );
    }
  } catch (err) {
    console.error("Booking completion check failed:", err.message);
  }
};

// DBS expiry: un-verify tutors with expired DBS weekly.
const DBS_EXPIRY_CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const runDbsExpiryCheckSafe = async () => {
  try {
    await runDbsExpiryCheck();
  } catch (err) {
    console.error('DBS expiry check failed:', err?.message || err);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  runCompletionCheck();
  setInterval(runCompletionCheck, COMPLETION_CHECK_INTERVAL_MS);

  // Start the weekly DBS expiry job immediately, then keep it running.
  runDbsExpiryCheckSafe();
  setInterval(runDbsExpiryCheckSafe, DBS_EXPIRY_CHECK_INTERVAL_MS);
});
