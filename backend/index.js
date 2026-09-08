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
import blogRoutes from "./routes/blogRoutes.js";
import publicAssetsRoutes from "./routes/publicAssetsRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import benefitRoutes from "./routes/benefitRoutes.js";
import popularSearchRoutes from "./routes/popularSearchRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import { applyRedirects, logNotFound } from "./middlewares/seoTraffic.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { attachSocketServer } from "./services/socketService.js";
import { completeEligibleBookings } from "./services/bookingService.js";
import { runDbsExpiryCheck } from "./services/dbsExpiryService.js";
import { logTransactionalEmailStatus } from "./services/emailService.js";
import { renderSeoHtml } from "./services/seoHtmlService.js";
import { resolveRouteStatus } from "./services/routeStatus.js";
import fs from "node:fs";
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
app.use("/api/blog", blogRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/benefits", benefitRoutes);
app.use("/api/why-choose-us", benefitRoutes);
app.use("/api/benefit", benefitRoutes);
app.use("/api/popular-searches", popularSearchRoutes);
app.use("/api/popular-search", popularSearchRoutes);

// Configured 301/302 rules. Registered before static files and the SPA so a
// redirect wins over a stale prerendered page sitting at the same path.
app.use(applyRedirects());

// Crawler files (robots.txt, sitemap.xml, llms.txt) generated from live content.
// Registered before the SPA catch-all so they are not answered with index.html.
app.use("/", seoRoutes);

/**
 * POST /__seo-html
 * Development helper. The Vite dev server posts its index.html here so the same
 * SEO injection Express performs in production is visible on :5173 too.
 * Disabled in production, where Express serves the built SPA directly.
 */
app.post("/__seo-html", async (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }
  try {
    const { path: requestPath, html } = req.body ?? {};
    if (typeof html !== "string" || !html) {
      return res.status(400).json({ message: "html is required" });
    }
    const rendered = await renderSeoHtml(html, typeof requestPath === "string" ? requestPath : "/");
    return res.json({ html: rendered });
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const frontendDist = path.join(__dirname, "../frontend/dist");
const frontendIndexHtml = path.join(frontendDist, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexHtml);

/**
 * Locate the best HTML file to serve for a client route.
 *
 * The build prerenders some routes into their own directory (dist/about/index.html).
 * Those files are richer than the empty SPA shell, so they are preferred when
 * present, with dist/index.html as the fallback for every other route.
 *
 * @param {string} requestPath - Path from the incoming request.
 * @returns {Promise<string>} Absolute path to the HTML file to render.
 */
const resolveHtmlFileForRoute = async (requestPath) => {
  const safeSegments = requestPath
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..");
  if (safeSegments.length === 0) return frontendIndexHtml;

  const prerendered = path.join(frontendDist, ...safeSegments, "index.html");
  // Guard against path traversal escaping the build directory.
  if (!prerendered.startsWith(frontendDist)) return frontendIndexHtml;

  try {
    await fs.promises.access(prerendered, fs.constants.R_OK);
    return prerendered;
  } catch {
    return frontendIndexHtml;
  }
};

// Serve built SPA when available. Order matters: this must run before 404 handlers so
// hard reloads on client routes (/dashboard, /tutor, etc.) receive index.html.
if (hasFrontendBuild) {
  // index: false is deliberate. With the default, express.static answers "/about"
  // with the prerendered dist/about/index.html directly and the SEO handler below
  // never runs, so those pages would ship without canonical tags or structured
  // data. Serving assets only lets every HTML response go through renderSeoHtml.
  // redirect: false stops express.static answering "/about" with a 301 to
  // "/about/" just because a prerendered directory exists there. That hop costs
  // a round trip and produces a URL that disagrees with the canonical tag.
  app.use(express.static(frontendDist, { index: false, redirect: false }));

  // Record page paths that match no known route, so the SEO team can see which
  // broken links deserve a redirect. Runs after static files so real assets are
  // never counted as misses.
  app.use(logNotFound());

  app.get("*", async (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/socket.io")
    ) {
      return next();
    }
    try {
      const htmlFile = await resolveHtmlFileForRoute(req.path);
      const indexHtml = await fs.promises.readFile(htmlFile, "utf8");
      // A path matching no route answers 404 while still serving the app, so
      // the visitor sees the "page not found" screen and crawlers are told the
      // URL does not exist instead of indexing it.
      const status = await resolveRouteStatus(req.path);
      const html = await renderSeoHtml(indexHtml, req.path, { noindex: status === 404 });
      res.status(status);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "no-store");
      res.send(html);
    } catch (err) {
      next(err);
    }
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
