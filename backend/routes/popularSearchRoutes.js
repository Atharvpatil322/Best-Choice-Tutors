import express from "express";
import { getActivePopularSearches } from "../controllers/popularSearchController.js";

const router = express.Router();

// Public popular searches route
// GET /api/popular-searches - List active popular searches
router.get("/", getActivePopularSearches);

export default router;
