import express from "express";
import { getActiveBenefits } from "../controllers/benefitController.js";
import { publicCache } from "../middlewares/publicCache.js";

const router = express.Router();

// Public benefits route
// GET /api/benefits - List active benefits
router.get("/", publicCache(300, 600), getActiveBenefits);

export default router;
