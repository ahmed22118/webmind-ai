import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";

dotenv.config();

const app = express();

// Render (and most cloud platforms) sit behind a reverse proxy that adds
// X-Forwarded-For headers. Trusting exactly one hop tells Express (and
// express-rate-limit) to correctly read the real client IP from that header,
// rather than rejecting requests due to an untrusted proxy setup.
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman/curl/Thunder Client) during dev,
      // and only allow browser origins that are explicitly whitelisted.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) || 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Friendly root response for anyone browsing the API URL directly
app.get("/", publicLimiter, (req, res) => {
  res.json({
    service: "WebMind AI API",
    status: "running",
    message: "This is the backend API for WebMind AI. Visit the app at https://webmind-ai-pi.vercel.app",
    docs: {
      health: "/api/health",
    },
  });
});

// Health check
app.get("/api/health", publicLimiter, (req, res) => {
  res.json({ status: "ok", service: "WebMind AI backend", day: 8 });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/websites", websiteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 WebMind AI backend running on http://localhost:${PORT}`);
  });
});