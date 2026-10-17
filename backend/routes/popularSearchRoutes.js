import express from "express";
import { getActivePopularSearches } from "../controllers/popularSearchController.js";
import { publicCache } from "../middlewares/publicCache.js";

const router = express.Router();

// Public popular searches route
// GET /api/popular-searches - List active popular searches
router.get("/", publicCache(300, 600), getActivePopularSearches);

export default router;
