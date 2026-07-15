import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validation/schemas.js";
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 10,
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validateBody(registerSchema), registerUser);
router.post("/login", authLimiter, validateBody(loginSchema), loginUser);
router.get("/me", protect, getMe);

export default router;