import Tutor from "../models/Tutor.js";
import User from "../models/User.js";
import Availability from "../models/Availability.js";
import { validationResult } from "express-validator";
import { normalizeSubjects, normalizeSubject } from "../utils/subjectUtils.js";
import { createPayoutOnboardingLink } from "../services/stripeConnectService.js";
import {
  uploadImage,
  presignProfilePhotoUrl,
  deleteProfilePhotoByUrl,
} from "../services/s3Service.js";
import { getTutorRating } from "../services/reviewService.js";
import { geocodeAddress } from "../services/geocodingService.js";

/**
 * Return qualifications for API response. Backward compatibility: if tutor has experienceYears
 * but no qualifications, map to a single qualification entry.
 * @param {Object} tutor - Tutor document (plain or mongoose)
 * @returns {Array<{ title: string, institution: string, year: string }>}
 */
function getQualificationsForResponse(tutor) {
  const quals = tutor.qualifications;
  if (Array.isArray(quals) && quals.length > 0) {
    return quals.map((q) => ({
      title: q.title != null ? String(q.title).trim() : "",
      institution: q.institution != null ? String(q.institution).trim() : "",
      year: q.year != null ? String(q.year).trim() : "",
    }));
  }
  const exp = tutor.experienceYears;
  if (exp != null && Number(exp) >= 0) {
    const years = Number(exp);
    return [
      {
        title: `${years} ${years === 1 ? "year" : "years"} teaching experience`,
        institution: "",
        year: String(years),
      },
    ];
  }
  return [];
}

/**
 * Create tutor profile
 * Phase 3.1: Create tutor profile (auth required)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const createTutor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const userId = req.user._id;

    // Check if user already has a tutor profile
    const existingTutor = await Tutor.findOne({ userId });
    if (existingTutor) {
      return res.status(400).json({
        message: "Tutor profile already exists for this user",
      });
    }

    // Extract tutor data from request body (FormData may send qualifications as JSON string).
    let {
      fullName,
      bio,
      subjects,
      qualifications,
      experienceYears,
      hourlyRate,
      mode,
      location,
    } = req.body;

    let geoData = {
      type: "Point",
      coordinates: [0, 0], // Default
      address: location || "",
    };

    if ((mode === "In-Person" || mode === "Both") && location) {
      const coords = await geocodeAddress(location);

      if (!coords) {
        return res.status(400).json({
          message:
            "We could not verify this location. Please enter a valid city or area name.",
        });
      }

      geoData.coordinates = [coords.lng, coords.lat];
    }

    if (typeof qualifications === "string" && qualifications.trim()) {
      try {
        qualifications = JSON.parse(qualifications);
      } catch {
        qualifications = [];
      }
    }

    // Normalize subjects (trim, collapse spaces, title case, dedupe)
    const rawSubjects = Array.isArray(subjects) ? subjects : subjects ? [subjects] : [];
    const { values: subjectsArray, error: subjectError } = normalizeSubjects(rawSubjects);
    if (subjectError) {
      return res.status(400).json({ message: subjectError });
    }
    if (subjectsArray.length === 0) {
      return res.status(400).json({ message: "At least one subject is required." });
    }

    // Normalize qualifications: array of { title, institution, year }
    const qualificationsArray = Array.isArray(qualifications)
      ? qualifications
          .filter(
            (q) =>
              q && (q.title != null || q.institution != null || q.year != null),
          )
          .map((q) => ({
            title: q.title != null ? String(q.title).trim() : "",
            institution:
              q.institution != null ? String(q.institution).trim() : "",
            year: q.year != null ? String(q.year).trim() : "",
          }))
      : [];

    // Handle profile photo upload if provided
    let profilePhotoUrl = null;
    if (req.file) {
      try {
        profilePhotoUrl = await uploadImage(req.file.buffer);
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        return res.status(500).json({
          message: "Failed to upload profile photo",
          error: error.message,
        });
      }
    }

    // Create tutor profile
    const tutor = await Tutor.create({
      userId,
      fullName,
      bio,
      subjects: subjectsArray,
      qualifications: qualificationsArray,
      experienceYears: parseInt(experienceYears, 10),
      hourlyRate: parseFloat(hourlyRate),
      mode,
      location: geoData,
      profilePhoto: profilePhotoUrl,
    });

    // Phase 5.5: Role sync - user becomes a Tutor after creating tutor profile
    // Do not change auth logic; persist role in User document.
    await User.findByIdAndUpdate(userId, { role: "Tutor" });

    // Populate user reference for response
    await tutor.populate("userId", "name email");

    const profilePhoto = await presignProfilePhotoUrl(tutor.profilePhoto);
    res.status(201).json({
      message: "Tutor profile created successfully",
      tutor: {
        id: tutor._id,
        userId: tutor.userId._id,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto,
        createdAt: tutor.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all tutors (public)
 * Public read-only endpoint with filtering and pagination
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const listTutors = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      distance = 10,
      subject,
      mode,
      priceMin,
      priceMax,
      gender,
      page = 1,
      limit = 12,
    } = req.query;

    const hasGeo = lat && lng;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build base match query for non-geo filters (used in $geoNear.query or $match)
    let matchQuery = {};
    if (subject && subject.trim()) {
      const { value: normalizedSubject } = normalizeSubject(subject.trim());
      if (normalizedSubject) {
        matchQuery.subjects = { $in: [normalizedSubject] };
      }
    }
    if (mode && mode.trim()) {
      const modeValue = mode.trim();
      if (["Online", "In-Person", "Both"].includes(modeValue)) {
        matchQuery.mode = modeValue;
      }
    }
    if (priceMin || priceMax) {
      matchQuery.hourlyRate = {};
      if (priceMin) matchQuery.hourlyRate.$gte = parseFloat(priceMin);
      if (priceMax) matchQuery.hourlyRate.$lte = parseFloat(priceMax);
    }

    let userQuery = {};
    if (gender && gender.trim()) {
      const genderValue = gender.trim().toUpperCase();
      if (["MALE", "FEMALE"].includes(genderValue)) {
        userQuery.gender = genderValue;
      }
    }

    const lookupAndUnwind = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    const afterLookupMatch =
      Object.keys(userQuery).length > 0
        ? [{ $match: { "user.gender": userQuery.gender } }]
        : [];

    let totalCount;
    let tutors;

    if (hasGeo) {
      // $geoNear: sort by distance (nearest first), no maxDistance so we do NOT filter by radius
      const geoNearStage = {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          spherical: true,
          key: "location.coordinates",
        },
      };
      if (Object.keys(matchQuery).length > 0) {
        geoNearStage.$geoNear.query = matchQuery;
      }

      const geoStages = [
        geoNearStage,
        ...lookupAndUnwind,
        ...afterLookupMatch,
      ];
      const countPipeline = [...geoStages, { $count: "total" }];
      const countResult = await Tutor.aggregate(countPipeline);
      totalCount = countResult.length > 0 ? countResult[0].total : 0;

      const dataPipeline = [
        ...geoStages,
        { $skip: skip },
        { $limit: limitNum },
      ];
      tutors = await Tutor.aggregate(dataPipeline);
    } else {
      const baseStages =
        Object.keys(matchQuery).length > 0
          ? [{ $match: matchQuery }, ...lookupAndUnwind, ...afterLookupMatch]
          : [...lookupAndUnwind, ...afterLookupMatch];

      const countPipeline = [...baseStages, { $count: "total" }];
      const countResult = await Tutor.aggregate(countPipeline);
      totalCount = countResult.length > 0 ? countResult[0].total : 0;

      const dataPipeline = [
        ...baseStages,
        { $skip: skip },
        { $limit: limitNum },
        { $sort: { createdAt: -1 } },
      ];
      tutors = await Tutor.aggregate(dataPipeline);
    }

    // Get ratings and profile photos
    const ratings = await Promise.all(tutors.map((t) => getTutorRating(t._id)));
    const profilePhotos = await Promise.all(
      tutors.map((t) => presignProfilePhotoUrl(t.profilePhoto || null)),
    );

    // Format response with only safe public fields
    const formattedTutors = tutors.map((tutor, i) => {
      const userId = tutor.userId?.toString() || tutor.user?._id?.toString() || null;
      const { averageRating, reviewCount } = ratings[i];
      const coords = tutor.location?.coordinates;
      const hasCoords = Array.isArray(coords) && coords.length >= 2;
      return {
        id: tutor._id.toString(),
        userId,
        fullName: tutor.fullName || null,
        bio: tutor.bio || null,
        subjects: Array.isArray(tutor.subjects) ? tutor.subjects : [],
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate || null,
        mode: tutor.mode || null,
        location: {
          address: tutor.location?.address ?? null,
          lat: hasCoords ? coords[1] : null,
          lng: hasCoords ? coords[0] : null,
        },
        profilePhoto: profilePhotos[i],
        createdAt: tutor.createdAt || null,
        averageRating,
        reviewCount,
        isVerified: !!tutor.isVerified,
        isDbsVerified: !!tutor.isDbsVerified,
      };
    });

    res.json({
      tutors: formattedTutors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tutor by ID (public)
 * Phase 3.1: View tutor endpoint
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tutor = await Tutor.findById(id).populate("userId", "name email");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const userId =
      tutor.userId && tutor.userId._id ? tutor.userId._id : tutor.userId;
    const { averageRating, reviewCount } = await getTutorRating(tutor._id);

    const formattedLocation = tutor.location
      ? {
          address: tutor.location.address || "",
          lat: tutor.location.coordinates
            ? tutor.location.coordinates[1]
            : null,
          lng: tutor.location.coordinates
            ? tutor.location.coordinates[0]
            : null,
        }
      : null;

    const profilePhoto = await presignProfilePhotoUrl(
      tutor.profilePhoto || null,
    );
    res.json({
      tutor: {
        id: tutor._id,
        userId,
        fullName: tutor.fullName || null,
        bio: tutor.bio || null,
        subjects: Array.isArray(tutor.subjects) ? tutor.subjects : [],
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate || null,
        mode: tutor.mode || null,
        location: formattedLocation,
        profilePhoto,
        createdAt: tutor.createdAt || null,
        averageRating,
        reviewCount,
        isVerified: !!tutor.isVerified,
        isDbsVerified: !!tutor.isDbsVerified,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid tutor ID format" });
    }
    next(error);
  }
};

/**
 * Get authenticated tutor's own profile
 * GET /api/tutor/profile
 *
 * Authenticated tutor only.
 * Returns tutor profile data linked to the current user.
 */
export const getMyTutorProfile = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!user._id) {
      return res.status(401).json({ message: "Invalid user session" });
    }

    // Role must be Tutor
    if (user.role !== "Tutor") {
      return res
        .status(403)
        .json({ message: "Access denied: Tutor role required" });
    }

    const tutor = await Tutor.findOne({ userId: user._id });

    const phone =
      user.phone && (user.phone.countryCode || user.phone.number)
        ? {
            countryCode: user.phone.countryCode || null,
            number: user.phone.number || null,
          }
        : null;

    let userProfilePhoto = null;
    try {
      userProfilePhoto = await presignProfilePhotoUrl(user.profilePhoto || null);
    } catch (e) {
      console.warn('getMyTutorProfile: presign user photo failed', e?.message);
    }
    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone,
      gender: user.gender ?? null,
      profilePhoto: userProfilePhoto,
    };

    if (!tutor) {
      return res.status(200).json({
        tutor: null,
        needsSetup: true,
        user: userPayload,
      });
    }

    let averageRating = 0;
    let reviewCount = 0;
    try {
      const rating = await getTutorRating(tutor._id);
      averageRating = rating?.averageRating ?? 0;
      reviewCount = rating?.reviewCount ?? 0;
    } catch (e) {
      console.warn('getMyTutorProfile: getTutorRating failed', e?.message);
    }
    let tutorProfilePhoto = null;
    try {
      tutorProfilePhoto = await presignProfilePhotoUrl(tutor.profilePhoto);
    } catch (e) {
      console.warn('getMyTutorProfile: presign tutor photo failed', e?.message);
    }

    const payout = {
      onboardingStatus: tutor.stripeOnboardingStatus || 'NOT_STARTED',
      lastOnboardingError: tutor.lastOnboardingError || null,
      chargesEnabled: !!tutor.chargesEnabled,
      payoutsEnabled: !!tutor.payoutsEnabled,
    };
    res.json({
      tutor: {
        id: tutor._id,
        userId: tutor.userId,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutorProfilePhoto,
        createdAt: tutor.createdAt,
        averageRating,
        reviewCount,
        isVerified: !!tutor.isVerified,
        isDbsVerified: !!tutor.isDbsVerified,
        payout,
      },
      needsSetup: false,
      user: userPayload,
    });
  } catch (error) {
    console.error('getMyTutorProfile error:', error?.message, error?.stack);
    next(error);
  }
};

/**
 * Lightweight check: does the authenticated tutor have a Tutor profile document?
 * GET /api/tutor/profile/status — for sidebar dot / "complete your profile" indicator.
 */
export const getTutorProfileStatus = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "Tutor") {
      return res.status(403).json({ message: "Tutor only" });
    }
    const tutor = await Tutor.findOne({ userId: user._id })
      .select("_id profilePhoto")
      .lean();
    const profilePhoto = await presignProfilePhotoUrl(
      tutor?.profilePhoto ?? null,
    );
    res.json({
      hasProfile: !!tutor,
      profilePhoto,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated tutor's own profile and availability
 * PUT /api/tutor/profile
 *
 * Authenticated tutor only.
 * Allows updating:
 * - bio (existing Tutor field)
 * - profilePhoto (via multipart/form-data)
 * - phone (on User model: countryCode, number)
 * - availability rules + exceptions (Availability model)
 *
 * Does NOT allow updating email.
 */
export const updateMyTutorProfile = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Role must be Tutor
    if (user.role !== "Tutor") {
      return res
        .status(403)
        .json({ message: "Access denied: Tutor role required" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const tutor = await Tutor.findOne({ userId: user._id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const {
      bio,
      qualifications: qualificationsPayload,
      experienceYears: experienceYearsPayload,
      subjects: subjectsPayload,
      hourlyRate: hourlyRatePayload,
      mode: modePayload,
      location: locationPayload,
      phone,
      gender,
      availabilityTimezone,
      availabilityWeeklyRules,
      availabilityExceptions,
      clearProfilePhoto,
    } = req.body;

    // Clear or update profile photo (delete old from S3 when clearing)
    const wantClearPhoto =
      clearProfilePhoto === "true" ||
      clearProfilePhoto === "1" ||
      clearProfilePhoto === true;
    if (wantClearPhoto) {
      if (tutor.profilePhoto) await deleteProfilePhotoByUrl(tutor.profilePhoto);
      tutor.profilePhoto = null;
    }

    // Update tutor bio if provided
    if (bio !== undefined) {
      tutor.bio = bio.trim();
    }

    // Update subjects if provided (at least one required when provided)
    if (subjectsPayload !== undefined) {
      const rawArr = Array.isArray(subjectsPayload)
        ? subjectsPayload.filter((s) => s != null)
        : [];
      const { values: arr, error: subjectError } = normalizeSubjects(rawArr);
      if (subjectError) {
        return res.status(400).json({ message: subjectError });
      }
      if (arr.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one subject is required." });
      }
      tutor.subjects = arr;
    }

    // Update hourly rate if provided (must be positive)
    if (hourlyRatePayload !== undefined) {
      const num = Number(hourlyRatePayload);
      if (!Number.isFinite(num) || num <= 0) {
        return res
          .status(400)
          .json({ message: "Hourly rate must be a positive number." });
      }
      tutor.hourlyRate = num;
    }

    // Update teaching mode if provided
    if (modePayload !== undefined) {
      const valid = ["Online", "In-Person", "Both"].includes(modePayload);
      if (!valid) {
        return res.status(400).json({
          message: "Teaching mode must be Online, In-Person, or Both.",
        });
      }
      tutor.mode = modePayload;
      // When mode is Online only, clear location
      if (modePayload === "Online") {
        tutor.location = null;
      }
    }

    // Update location if provided; required when mode includes in-person
    if (locationPayload !== undefined) {
      const loc = locationPayload != null ? String(locationPayload).trim() : "";
      if (tutor.mode === "Online") {
        tutor.location = null;
      } else if (tutor.mode === "In-Person" || tutor.mode === "Both") {
        if (!loc) {
          return res.status(400).json({
            message:
              "Location is required when teaching mode includes in-person.",
          });
        }
        // NEW: Geocode the string into coordinates
        const coords = await geocodeAddress(loc);

        if (coords) {
          // Set the object correctly so Mongoose doesn't complain
          tutor.location = {
            type: "Point",
            coordinates: [coords.lng, coords.lat], // [Longitude, Latitude]
            address: loc,
          };
        } else {
          return res
            .status(400)
            .json({ message: "Could not verify location coordinates." });
        }
      }
    }

    // Update experience years if provided
    if (experienceYearsPayload !== undefined) {
      const parsed = parseInt(experienceYearsPayload, 10);
      if (Number.isInteger(parsed) && parsed >= 0) {
        tutor.experienceYears = parsed;
      }
    }

    // Update qualifications if provided
    if (qualificationsPayload !== undefined) {
      const parsed =
        typeof qualificationsPayload === "string"
          ? (() => {
              try {
                return JSON.parse(qualificationsPayload);
              } catch {
                return [];
              }
            })()
          : qualificationsPayload;
      tutor.qualifications = Array.isArray(parsed)
        ? parsed
            .filter(
              (q) =>
                q &&
                (q.title != null || q.institution != null || q.year != null),
            )
            .map((q) => ({
              title: q.title != null ? String(q.title).trim() : "",
              institution:
                q.institution != null ? String(q.institution).trim() : "",
              year: q.year != null ? String(q.year).trim() : "",
            }))
        : [];
    }

    // Handle optional profile photo upload (after clear so new file wins). Delete old from S3 when replacing.
    if (req.file) {
      try {
        if (tutor.profilePhoto)
          await deleteProfilePhotoByUrl(tutor.profilePhoto);
        const profilePhotoUrl = await uploadImage(req.file.buffer);
        tutor.profilePhoto = profilePhotoUrl;
      } catch (error) {
        console.error("Error uploading tutor profile photo:", error);
        return res.status(500).json({
          message: "Failed to upload profile photo",
          error: error.message,
        });
      }
    }

    await tutor.save();

    // Update user-level fields (gender is on User model)
    if (gender !== undefined) {
      user.gender = (gender === "MALE" || gender === "FEMALE") ? gender : null;
    }

    // Parse and validate structured phone object if provided
    if (phone !== undefined) {
      let parsedPhone = null;
      if (typeof phone === "string" && phone.trim() !== "") {
        try {
          parsedPhone = JSON.parse(phone);
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid phone format: must be a JSON object" });
        }
      } else if (typeof phone === "object" && phone !== null) {
        parsedPhone = phone;
      }

      if (parsedPhone) {
        const countryCode = parsedPhone.countryCode || null;
        const number = parsedPhone.number || null;

        // Simple validation: enforce rules based on countryCode
        if (countryCode === "+91" && number) {
          if (!/^\d{10}$/.test(number)) {
            return res.status(400).json({
              message: "For +91, phone number must be exactly 10 digits.",
            });
          }
        }

        user.phone = { countryCode, number };
      } else {
        user.phone = { countryCode: null, number: null };
      }
      await user.save();
    } else if (gender !== undefined) {
      await user.save();
    }

    // Update availability if any availability fields are present
    const hasAvailabilityPayload =
      availabilityTimezone !== undefined ||
      availabilityWeeklyRules !== undefined ||
      availabilityExceptions !== undefined;

    let updatedAvailability = null;

    if (hasAvailabilityPayload) {
      // Find or create availability for this tutor
      let availability = await Availability.findOne({ tutorId: tutor._id });

      if (!availability) {
        // If no availability exists yet, create a new document
        availability = new Availability({
          tutorId: tutor._id,
          timezone: availabilityTimezone || "Europe/London",
          weeklyRules: Array.isArray(availabilityWeeklyRules)
            ? availabilityWeeklyRules
            : [],
          exceptions: Array.isArray(availabilityExceptions)
            ? availabilityExceptions
            : [],
        });
      } else {
        if (availabilityTimezone !== undefined) {
          availability.timezone = availabilityTimezone;
        }
        if (availabilityWeeklyRules !== undefined) {
          availability.weeklyRules = Array.isArray(availabilityWeeklyRules)
            ? availabilityWeeklyRules
            : [];
        }
        if (availabilityExceptions !== undefined) {
          availability.exceptions = Array.isArray(availabilityExceptions)
            ? availabilityExceptions
            : [];
        }
      }

      await availability.save();

      updatedAvailability = {
        id: availability._id,
        tutorId: availability.tutorId,
        timezone: availability.timezone,
        weeklyRules: availability.weeklyRules,
        exceptions: availability.exceptions,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      };
    }

    // Normalize phone for response
    let phoneResponse = null;
    if (user.phone && (user.phone.countryCode || user.phone.number)) {
      phoneResponse = {
        countryCode: user.phone.countryCode || null,
        number: user.phone.number || null,
      };
    }

    const tutorProfilePhoto = await presignProfilePhotoUrl(tutor.profilePhoto);
    const userProfilePhoto = await presignProfilePhotoUrl(
      user.profilePhoto || null,
    );
    res.json({
      message: "Tutor profile updated successfully",
      tutor: {
        id: tutor._id,
        userId: tutor.userId,
        fullName: tutor.fullName,
        bio: tutor.bio,
        subjects: tutor.subjects,
        qualifications: getQualificationsForResponse(tutor),
        experienceYears: tutor.experienceYears ?? null,
        hourlyRate: tutor.hourlyRate,
        mode: tutor.mode,
        location: tutor.location,
        profilePhoto: tutorProfilePhoto,
        createdAt: tutor.createdAt,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: phoneResponse,
        gender: user.gender ?? null,
        profilePhoto: userProfilePhoto,
      },
      availability: updatedAvailability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Stripe Connect onboarding link and return URL. Tutor clicks "Complete Payout Setup" → redirect to Stripe.
 * POST /api/tutor/payout-setup
 * Creates Express account if not exists (idempotent: one per tutor). Returns URL to redirect.
 */
export const createPayoutSetupLink = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (user.role !== "Tutor") {
      return res.status(403).json({ message: "Access denied: Tutor role required" });
    }

    const tutor = await Tutor.findOne({ userId: user._id }).lean();
    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const userDoc = await User.findById(user._id).lean();
    const email = userDoc?.email;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const returnUrl = `${baseUrl}/tutor/profile`;
    const refreshUrl = `${baseUrl}/tutor/profile`;

    const { onboardingUrl } = await createPayoutOnboardingLink(tutor, email, returnUrl, refreshUrl);

    return res.status(200).json({
      message: "Onboarding link created. Redirect the user to the URL.",
      onboardingUrl,
    });
  } catch (err) {
    // Log full Stripe error for debugging Connect setup issues
    console.error("Payout setup error:", {
      message: err?.message,
      code: err?.code,
      type: err?.type,
      raw: err?.raw?.message,
    });
    const message =
      (err?.message && String(err.message).trim()) ||
      "Payout setup failed. Please try again.";
    return res.status(400).json({
      message,
      payout: {
        onboardingStatus: "FAILED",
        lastOnboardingError: message,
      },
    });
  }
};
