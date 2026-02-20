import Availability from "../models/Availability.js";
import Tutor from "../models/Tutor.js";
import { validationResult } from "express-validator";

/**
 * Helper function to verify user has a tutor profile
 * @param {Object} userId - User ID from request
 * @returns {Object|null} Tutor profile or null
 */
const verifyTutorProfile = async (userId) => {
  const tutor = await Tutor.findOne({ userId });
  return tutor;
};

/**
 * Create or set tutor availability
 * Phase 4.1: POST /api/tutors/me/availability
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const createAvailability = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const userId = req.user._id;

    // Verify user has a tutor profile
    const tutor = await verifyTutorProfile(userId);
    if (!tutor) {
      return res.status(403).json({
        message:
          "Tutor profile not found. Please create a tutor profile first.",
      });
    }

    // Check if availability already exists
    const existingAvailability = await Availability.findOne({
      tutorId: tutor._id,
    });
    if (existingAvailability) {
      return res.status(400).json({
        message: "Availability already exists. Use PUT to update.",
      });
    }

    const { timezone, weeklyRules, exceptions } = req.body;

    // Validate time ranges
    if (weeklyRules) {
      for (const rule of weeklyRules) {
        if (rule.startTime >= rule.endTime) {
          return res.status(400).json({
            message: `Invalid time range for day ${rule.dayOfWeek}: start time must be before end time`,
          });
        }
      }
    }

    if (exceptions) {
      for (const exception of exceptions) {
        if (exception.startTime >= exception.endTime) {
          return res.status(400).json({
            message: `Invalid time range for exception on ${exception.date}: start time must be before end time`,
          });
        }
      }
    }

    // Create availability
    const availability = await Availability.create({
      tutorId: tutor._id,
      timezone,
      weeklyRules: weeklyRules || [],
      exceptions: exceptions || [],
    });

    res.status(201).json({
      message: "Availability created successfully",
      availability: {
        id: availability._id,
        tutorId: availability.tutorId,
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      },
    });
  } catch (error) {
    // Handle validation errors from schema
    if (error.message && error.message.includes("Invalid time range")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * Get tutor's own availability
 * Phase 4.1: GET /api/tutors/me/availability
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const getAvailability = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Verify user has a tutor profile
    const tutor = await verifyTutorProfile(userId);
    if (!tutor) {
      return res.status(403).json({
        message:
          "Tutor profile not found. Please create a tutor profile first.",
      });
    }

    // Find availability
    const availability = await Availability.findOne({ tutorId: tutor._id });

    if (!availability) {
      return res.status(404).json({
        message: "Availability not found. Please create availability first.",
      });
    }

    res.json({
      availability: {
        id: availability._id,
        tutorId: availability.tutorId,
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate time slots for a tutor
 * Phase 4.3: GET /api/tutors/:id/slots
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const generateSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Support both 'from/to' and 'startDate/endDate' for backward compatibility
    const fromDate = req.query.from || req.query.startDate;
    const toDate = req.query.to || req.query.endDate;

    // Validate required query parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({
        message:
          "Both from/to (or startDate/endDate) query parameters are required (format: YYYY-MM-DD)",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return res.status(400).json({
        message: "Dates must be in YYYY-MM-DD format",
      });
    }

    // Parse dates
    const start = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T23:59:59");

    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid date format",
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: "from/startDate must be before or equal to to/endDate",
      });
    }

    // Find tutor by ID
    const tutor = await Tutor.findById(id);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Find availability for this tutor
    const availability = await Availability.findOne({ tutorId: tutor._id });

    // If no availability exists, return empty list
    if (!availability) {
      return res.json({ slots: [] });
    }

    // Generate slots with deduplication
    // Use a Map keyed by "date|startTime|endTime" to prevent duplicates
    const slotsMap = new Map();
    const SLOT_DURATION_MINUTES = 60;
    const currentDate = new Date(start);

    // Iterate through each day in the range (use local calendar date so dateStr matches dayOfWeek)
    while (currentDate <= end) {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const d = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (local), matches getDay()
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Find weekly rule for this day
      const weeklyRule = availability.weeklyRules.find(
        (rule) => rule.dayOfWeek === dayOfWeek,
      );

      // Find exceptions for this date
      const exceptions = availability.exceptions.filter(
        (exception) => exception.date === dateStr,
      );

      // If there's an override exception, use it instead of weekly rule
      const overrideException = exceptions.find(
        (exception) => exception.type === "override",
      );

      if (overrideException) {
        // Generate slots based on override exception
        const slotsForDay = generateSlotsForTimeRange(
          dateStr,
          overrideException.startTime,
          overrideException.endTime,
          SLOT_DURATION_MINUTES,
        );
        // Add slots to map (deduplicates automatically)
        slotsForDay.forEach((slot) => {
          const key = `${slot.date}|${slot.startTime}|${slot.endTime}`;
          slotsMap.set(key, slot);
        });
      } else if (weeklyRule) {
        // Generate slots based on weekly rule
        let slotsForDay = generateSlotsForTimeRange(
          dateStr,
          weeklyRule.startTime,
          weeklyRule.endTime,
          SLOT_DURATION_MINUTES,
        );

        // Remove slots that are blocked by unavailable exceptions
        const unavailableExceptions = exceptions.filter(
          (exception) => exception.type === "unavailable",
        );

        for (const exception of unavailableExceptions) {
          slotsForDay = slotsForDay.filter((slot) => {
            // Remove slots that overlap with unavailable time
            return (
              slot.endTime <= exception.startTime ||
              slot.startTime >= exception.endTime
            );
          });
        }

        // Add slots to map (deduplicates automatically)
        slotsForDay.forEach((slot) => {
          const key = `${slot.date}|${slot.startTime}|${slot.endTime}`;
          slotsMap.set(key, slot);
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Convert map to array and sort for consistent output
    // Sort by date first, then by startTime
    let slots = Array.from(slotsMap.values()).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });

    // Filter out past slots server-side for deterministic output
    const now = new Date();
    slots = slots.filter((slot) => {
      const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
      return slotDateTime > now;
    });

    res.json({ slots });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid tutor ID format" });
    }
    next(error);
  }
};

/**
 * Helper function to generate slots for a time range
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @param {number} slotDurationMinutes - Duration of each slot in minutes
 * @returns {Array} Array of slot objects { date, startTime, endTime }
 */
function generateSlotsForTimeRange(
  date,
  startTime,
  endTime,
  slotDurationMinutes,
) {
  const slots = [];

  // Parse start and end times
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Generate slots
  let currentMinutes = startMinutes;
  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const slotStartMinutes = currentMinutes;
    const slotEndMinutes = currentMinutes + slotDurationMinutes;

    // Format times back to HH:mm
    const slotStartHour = Math.floor(slotStartMinutes / 60);
    const slotStartMin = slotStartMinutes % 60;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;

    const slotStartTime = `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMin).padStart(2, "0")}`;
    const slotEndTime = `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMin).padStart(2, "0")}`;

    slots.push({
      date,
      startTime: slotStartTime,
      endTime: slotEndTime,
    });

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

/**
 * Get public availability for a tutor
 * Phase 4.2: GET /api/tutors/:id/availability
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const getPublicAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find tutor by ID
    const tutor = await Tutor.findById(id);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Find availability for this tutor
    const availability = await Availability.findOne({ tutorId: tutor._id });

    // If no availability exists, return empty structure
    if (!availability) {
      return res.json({
        availability: {
          timezone: null,
          weeklyRules: [],
          exceptions: [],
        },
      });
    }

    // Return only public fields (no internal IDs)
    res.json({
      availability: {
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
      },
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid tutor ID format" });
    }
    next(error);
  }
};

/**
 * Update tutor's availability
 * Phase 4.1: PUT /api/tutors/me/availability
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const userId = req.user._id;

    // Verify user has a tutor profile
    const tutor = await verifyTutorProfile(userId);
    if (!tutor) {
      return res.status(403).json({
        message:
          "Tutor profile not found. Please create a tutor profile first.",
      });
    }

    // Find existing availability
    const availability = await Availability.findOne({ tutorId: tutor._id });

    if (!availability) {
      return res.status(404).json({
        message:
          "Availability not found. Use POST to create availability first.",
      });
    }

    const { timezone, weeklyRules, exceptions } = req.body;

    // Validate time ranges
    if (weeklyRules) {
      for (const rule of weeklyRules) {
        if (rule.startTime >= rule.endTime) {
          return res.status(400).json({
            message: `Invalid time range for day ${rule.dayOfWeek}: start time must be before end time`,
          });
        }
      }
    }

    if (exceptions) {
      for (const exception of exceptions) {
        if (exception.startTime >= exception.endTime) {
          return res.status(400).json({
            message: `Invalid time range for exception on ${exception.date}: start time must be before end time`,
          });
        }
      }
    }

    // Update availability
    if (timezone !== undefined) availability.timezone = timezone;
    if (weeklyRules !== undefined) availability.weeklyRules = weeklyRules;
    if (exceptions !== undefined) availability.exceptions = exceptions;

    await availability.save();

    res.json({
      message: "Availability information has been successfully updated.",
      availability: {
        id: availability._id,
        tutorId: availability.tutorId,
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      },
    });
  } catch (error) {
    // Handle validation errors from schema
    if (error.message && error.message.includes("Invalid time range")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
