import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import {
  createTutor,
  listTutors,
  getTutorById,
  getMyTutorProfile,
  updateMyTutorProfile,
} from "../controllers/tutorController.js";
import {
  getPublicAvailability,
  generateSlots,
  createAvailability,
  getAvailability,
  updateAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();

// Middleware to parse subjects array from FormData
const parseSubjectsArray = (req, res, next) => {
  // FormData sends multiple values with same key as array
  // If subjects is already an array, use it; otherwise convert to array
  if (req.body.subjects) {
    if (!Array.isArray(req.body.subjects)) {
      req.body.subjects = [req.body.subjects].filter(Boolean);
    } else {
      // Filter out empty values
      req.body.subjects = req.body.subjects.filter((s) => s && s.trim());
    }
  }
  next();
};

// Middleware to parse qualifications from FormData (sent as JSON string)
const parseQualificationsFromBody = (req, res, next) => {
  if (req.body.qualifications !== undefined) {
    if (
      typeof req.body.qualifications === "string" &&
      req.body.qualifications.trim()
    ) {
      try {
        req.body.qualifications = JSON.parse(req.body.qualifications);
      } catch {
        req.body.qualifications = [];
      }
    }
    if (!Array.isArray(req.body.qualifications)) {
      req.body.qualifications = [];
    }
  }
  next();
};

// Middleware to parse phone from FormData (sent as JSON string)
const parsePhoneFromBody = (req, res, next) => {
  if (
    req.body.phone !== undefined &&
    typeof req.body.phone === "string" &&
    req.body.phone.trim()
  ) {
    try {
      req.body.phone = JSON.parse(req.body.phone);
    } catch {
      req.body.phone = { countryCode: null, number: null };
    }
  }
  next();
};

// Validation rules for creating tutor profile
const createTutorValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("bio").trim().notEmpty().withMessage("Bio is required"),
  body("subjects")
    .custom((value) => {
      // Accept array or single string
      const subjects = Array.isArray(value) ? value : [value];
      if (subjects.length === 0 || subjects.every((s) => !s || !s.trim())) {
        return false;
      }
      return subjects.every(
        (subject) => typeof subject === "string" && subject.trim().length > 0,
      );
    })
    .withMessage(
      "At least one subject is required and all subjects must be non-empty strings",
    ),
  body("experienceYears")
    .isInt({ min: 0 })
    .withMessage("Experience years must be a non-negative integer"),
  body("qualifications")
    .isArray({ min: 1 })
    .withMessage("At least one qualification is required"),
  body("qualifications.*.title")
    .optional()
    .isString()
    .trim()
    .withMessage("Qualification title must be a string"),
  body("qualifications.*.institution")
    .optional()
    .isString()
    .trim()
    .withMessage("Qualification institution must be a string"),
  body("qualifications.*.year")
    .optional()
    .isString()
    .trim()
    .withMessage("Qualification year must be a string"),
  body("hourlyRate")
    .isFloat({ min: 0 })
    .withMessage("Hourly rate must be a non-negative number"),
  body("mode")
    .isIn(["Online", "In-Person", "Both"])
    .withMessage("Mode must be one of: Online, In-Person, Both"),
  body("location")
    .optional()
    .trim()
    .custom((value, { req }) => {
      // Location is optional, but if mode is In-Person or Both, it might be required
      // TODO: CLARIFICATION REQUIRED - Should location be required for In-Person or Both modes?
      return true;
    }),
  // Note: profilePhoto is handled via multipart/form-data upload, not validated here
];

// POST /api/tutors - Create tutor profile (auth required)
router.post(
  "/",
  authenticate, // Auth required for creating tutor profile
  upload.single("profilePhoto"), // Optional profile photo upload
  parseSubjectsArray, // Parse subjects array from FormData
  parseQualificationsFromBody, // Parse qualifications JSON string from FormData
  createTutorValidation,
  createTutor,
);

// GET /api/tutors - List all tutors (public)
router.get("/", listTutors);

// GET /api/tutor/profile - Get authenticated tutor's profile (tutor only)
router.get("/me/profile", authenticate, getMyTutorProfile);

// Validation rules for updating tutor profile via /tutor/profile
const updateTutorProfileValidation = [
  body("bio")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Bio must be a string with a reasonable length"),
  body("phone")
    .optional()
    .custom(
      (value) =>
        value === null ||
        value === undefined ||
        (typeof value === "object" && value !== null),
    )
    .withMessage("Phone must be an object with countryCode and number"),
  body("phone.countryCode")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Phone country code must be a string with reasonable length"),
  body("phone.number")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number must be a string with reasonable length"),
  body("availabilityTimezone")
    .optional()
    .isString()
    .trim()
    .withMessage("Availability timezone must be a string"),
  body("availabilityWeeklyRules")
    .optional()
    .isArray()
    .withMessage("Availability weekly rules must be an array"),
  body("availabilityExceptions")
    .optional()
    .isArray()
    .withMessage("Availability exceptions must be an array"),
];

// PUT /api/tutor/profile - Update authenticated tutor's profile (tutor only)
router.put(
  "/me/profile",
  authenticate,
  upload.single("profilePhoto"),
  parsePhoneFromBody,
  updateTutorProfileValidation,
  updateMyTutorProfile,
);

// Validation for weekly rule (for /me/availability routes)
const weeklyRuleValidation = body("weeklyRules")
  .optional()
  .isArray()
  .withMessage("Weekly rules must be an array")
  .custom((rules) => {
    if (!Array.isArray(rules)) return false;

    for (const rule of rules) {
      if (
        typeof rule.dayOfWeek !== "number" ||
        rule.dayOfWeek < 0 ||
        rule.dayOfWeek > 6
      ) {
        throw new Error("Each weekly rule must have dayOfWeek between 0 and 6");
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(rule.startTime)) {
        throw new Error("Each weekly rule startTime must be in HH:mm format");
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(rule.endTime)) {
        throw new Error("Each weekly rule endTime must be in HH:mm format");
      }
      if (rule.startTime >= rule.endTime) {
        throw new Error(
          "Start time must be before end time for each weekly rule",
        );
      }
    }

    // Check for duplicate dayOfWeek
    const days = rules.map((r) => r.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new Error("Duplicate day of week found in weekly rules");
    }

    return true;
  });

// Validation for exception (for /me/availability routes)
const exceptionValidation = body("exceptions")
  .optional()
  .isArray()
  .withMessage("Exceptions must be an array")
  .custom((exceptions) => {
    if (!Array.isArray(exceptions)) return false;

    for (const exception of exceptions) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.date)) {
        throw new Error("Each exception date must be in YYYY-MM-DD format");
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(exception.startTime)) {
        throw new Error("Each exception startTime must be in HH:mm format");
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(exception.endTime)) {
        throw new Error("Each exception endTime must be in HH:mm format");
      }
      if (exception.startTime >= exception.endTime) {
        throw new Error(
          "Start time must be before end time for each exception",
        );
      }
      if (!["unavailable", "override"].includes(exception.type)) {
        throw new Error(
          'Each exception type must be either "unavailable" or "override"',
        );
      }
    }

    return true;
  });

// Validation rules for creating/updating availability
const availabilityValidation = [
  body("timezone").trim().notEmpty().withMessage("Timezone is required"),
  weeklyRuleValidation,
  exceptionValidation,
];

// IMPORTANT: /me/availability routes must come BEFORE /:id route to avoid route conflict
// POST /api/tutors/me/availability - Create availability (auth, tutor only)
router.post(
  "/me/availability",
  authenticate,
  availabilityValidation,
  createAvailability,
);

// GET /api/tutors/me/availability - Get own availability (auth, tutor only)
router.get("/me/availability", authenticate, getAvailability);

// PUT /api/tutors/me/availability - Update availability (auth, tutor only)
router.put(
  "/me/availability",
  authenticate,
  availabilityValidation,
  updateAvailability,
);

// GET /api/tutors/:id/slots - Generate time slots for a tutor (public, read-only)
router.get("/:id/slots", generateSlots);

// GET /api/tutors/:id/availability - Get public availability for a tutor (public)
router.get("/:id/availability", getPublicAvailability);

// GET /api/tutors/:id - Get tutor by ID (public)
router.get("/:id", getTutorById);

export default router;
