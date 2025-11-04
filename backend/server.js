import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routers
import memberRoutes from "./routes/memberRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import marriageRoutes from "./routes/marriageRoutes.js";
import baptismRoutes from "./routes/baptismRoutes.js";
import deathRoutes from "./routes/deathRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// -------------------
// MongoDB Connection
// -------------------
mongoose
  .connect(process.env.MONGO_URI, { dbName: "churchDB" })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------
// API Routes
// -------------------
// Always use relative paths starting with "/"
// Wrap route registration in a try/catch to prevent invalid path crash
const safeUse = (path, router) => {
  try {
    if (!path.startsWith("/")) {
      throw new Error(`Route path must start with "/": ${path}`);
    }
    app.use(path, router);
  } catch (err) {
    console.error(`❌ Skipping router due to invalid path: ${err.message}`);
  }
};

safeUse("/api/members", memberRoutes);
safeUse("/api/families", familyRoutes);
safeUse("/api/marriages", marriageRoutes);
safeUse("/api/baptisms", baptismRoutes);
safeUse("/api/deaths", deathRoutes);
safeUse("/api/subscriptions", subscriptionRoutes);

// -------------------
// Test endpoints
// -------------------
app.get("/", (req, res) => res.send("✅ ChurchDB API is running"));

app.get("/api/test-db", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const counts = {};
    for (const col of collections) {
      counts[col.name] = await db.collection(col.name).countDocuments();
    }
    res.json({
      connected: mongoose.connection.readyState === 1,
      databaseName: db.databaseName,
      collections: collections.map((c) => c.name),
      documentCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// Serve React Frontend
// -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reactBuildPath = path.join(__dirname, "../tnp-proj/build");

app.use(express.static(reactBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

// -------------------
// Start Server
// -------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
