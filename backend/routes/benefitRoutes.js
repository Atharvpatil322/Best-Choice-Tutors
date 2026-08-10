import express from "express";
import { getActiveBenefits } from "../controllers/benefitController.js";

const router = express.Router();

// Public benefits route
// GET /api/benefits - List active benefits
router.get("/", getActiveBenefits);

export default router;
