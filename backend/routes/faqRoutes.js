import express from "express";
import { getActiveFaqs } from "../controllers/faqController.js";

const router = express.Router();

// Public FAQ route
// GET /api/faq - List active FAQs
router.get("/", getActiveFaqs);

export default router;

