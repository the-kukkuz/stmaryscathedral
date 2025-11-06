import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import memberRoutes from "./routes/memberRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import marriageRoutes from "./routes/marriageRoutes.js";
import baptismRoutes from "./routes/baptismRoutes.js";
import deathRoutes from "./routes/deathRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Test endpoints
app.get("/api/test-db", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const counts = {};
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      counts[col.name] = count;
    }
    res.json({
      connected: mongoose.connection.readyState === 1,
      databaseName: db.databaseName,
      collections: collections.map((c) => c.name),
      documentCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.get("/api/test-subscriptions", async (req, res) => {
  try {
    const Subscription = mongoose.model("Subscription");
    const count = await Subscription.countDocuments();
    const all = await Subscription.find().limit(5);
    res.json({
      count,
      collectionName: Subscription.collection.name,
      sample: all,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../tnp-proj/dist")));

// Catch-all route for React Router - use regex instead of "*"
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../tnp-proj/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
console.log("Starting server...");
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
