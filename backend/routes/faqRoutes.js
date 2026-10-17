import express from "express";
import { getActiveFaqs } from "../controllers/faqController.js";
import { publicCache } from "../middlewares/publicCache.js";

const router = express.Router();

// Public FAQ route
// GET /api/faq - List active FAQs
router.get("/", publicCache(300, 600), getActiveFaqs);

export default router;

