import express from "express";
import rateLimit from "express-rate-limit";
import {
  createWebsite,
  getMyWebsites,
  getWebsiteById,
  getWebsiteChunks,
  testSearch,
  deleteWebsite,
} from "../controllers/websiteController.js";
import { askQuestion, getConversationHistory, clearConversationHistory } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { createWebsiteSchema, testSearchSchema, askQuestionSchema } from "../validation/schemas.js";

const router = express.Router();

router.use(protect);

// Crawling launches a full browser instance per request — keep this tight
const crawlLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_CRAWL_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_CRAWL_MAX, 10) || 5,
  message: { message: "Too many crawl requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search is lighter than crawling but still shouldn't be spammable
const searchLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW_MS, 10) || 300000,
  max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX, 10) || 30,
  message: { message: "Too many search requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ask calls an LLM — moderate limit, weighted by cost
const askLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_ASK_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_ASK_MAX, 10) || 20,
  message: { message: "Too many questions asked. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", crawlLimiter, validateBody(createWebsiteSchema), createWebsite);
router.get("/", getMyWebsites);
router.get("/:id", getWebsiteById);
router.get("/:id/chunks", getWebsiteChunks);
router.post("/:id/test-search", searchLimiter, validateBody(testSearchSchema), testSearch);
router.post("/:id/ask", askLimiter, validateBody(askQuestionSchema), askQuestion);
router.get("/:id/conversations", getConversationHistory);
router.delete("/:id/conversations", clearConversationHistory);
router.delete("/:id", deleteWebsite);

export default router;