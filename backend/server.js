import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import marriageRoutes from "./routes/marriageRoutes.js";
import baptismRoutes from "./routes/baptismRoutes.js";
import deathRoutes from "./routes/deathRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import authMiddleware from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env loads regardless of where node is started from.
dotenv.config({ path: path.join(__dirname, ".env") });

const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "ALLOWED_ORIGIN"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", process.env.ALLOWED_ORIGIN],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:"]
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api", authMiddleware);

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "churchDB",
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// API Routes
app.use("/api/members", memberRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/marriages", marriageRoutes);
app.use("/api/baptisms", baptismRoutes);
app.use("/api/deaths", deathRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Root API endpoint
app.get("/api", (req, res) => {
  res.send("✅ ChurchDB API is running");
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../tnp-proj/dist")));

// Catch-all route for React Router - use regex instead of "*"
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../tnp-proj/dist/index.html"));
});

app.use((err, req, res, next) => {
  console.error("Unhandled route error:", err);

  const status = err.status || 500;
  const message = status >= 500 ? "An internal error occurred" : (err.message || "Request failed");

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({ error: message });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
console.log("Starting server...");
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
