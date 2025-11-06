import express from "express";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";

const router = express.Router();

// 🔍 DEBUG ROUTES - Must be first before any /:id routes

// Debug endpoint to test model
router.get("/debug", async (req, res) => {
  try {
    console.log("Debug endpoint hit");
    const count = await Subscription.countDocuments();
    const all = await Subscription.find();
    console.log("Found", count, "subscriptions");
    
    res.json({
      success: true,
      count,
      collectionName: Subscription.collection.name,
      data: all
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Raw data endpoint to see actual MongoDB data
router.get("/raw-data", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const rawData = await db.collection("subscriptions").find().limit(5).toArray();
    
    res.json({
      count: await db.collection("subscriptions").countDocuments(),
      sampleData: rawData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 SPECIFIC ROUTES - Must come before /:id

// Get Subscription Statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Total subscriptions
    const totalSubscriptions = await Subscription.countDocuments();

    // Total amount collected
    const totalAmount = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // This year's subscriptions
    const thisYearSubscriptions = await Subscription.countDocuments({
      year: currentYear
    });

    const thisYearAmount = await Subscription.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Year-wise breakdown
    const yearWiseStats = await Subscription.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    // Families with pending subscriptions
    const allFamilies = await Subscription.distinct("family_number");
    const paidFamiliesThisYear = await Subscription.distinct("family_number", {
      year: currentYear
    });
    const pendingFamilies = allFamilies.length - paidFamiliesThisYear.length;

    res.json({
      totalSubscriptions,
      totalAmount: totalAmount[0]?.total || 0,
      thisYearSubscriptions,
      thisYearAmount: thisYearAmount[0]?.total || 0,
      yearWiseStats,
      pendingFamilies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Dues Report
router.get("/reports/dues", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const allSubscriptions = await Subscription.find().sort({ year: -1 });

    const familyMap = new Map();

    allSubscriptions.forEach(sub => {
      if (!familyMap.has(sub.family_number)) {
        familyMap.set(sub.family_number, {
          family_number: sub.family_number,
          family_name: sub.family_name,
          hof: sub.hof,
          lastAmount: sub.amount,
          lastYear: sub.year,
          paidYears: [sub.year]
        });
      } else {
        const family = familyMap.get(sub.family_number);
        family.paidYears.push(sub.year);
      }
    });

    const duesReport = [];

    familyMap.forEach(family => {
      let dues = 0;
      const missingYears = [];

      for (let year = family.lastYear; year < currentYear; year++) {
        if (!family.paidYears.includes(year)) {
          dues += family.lastAmount;
          missingYears.push(year);
        }
      }

      if (!family.paidYears.includes(currentYear)) {
        dues += family.lastAmount;
        missingYears.push(currentYear);
      }

      if (dues > 0) {
        duesReport.push({
          ...family,
          dues,
          missingYears
        });
      }
    });

    duesReport.sort((a, b) => b.dues - a.dues);
    res.json(duesReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Subscription by Family Number
router.get("/family/:family_number", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      family_number: req.params.family_number
    }).sort({ year: -1 });

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Subscriptions by Year
router.get("/year/:year", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      year: parseInt(req.params.year)
    }).sort({ family_name: 1 });

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST - Add Subscription
router.post("/", async (req, res) => {
  try {
    const { family_number, year, amount } = req.body;

    // Validation
    if (!family_number || !year || !amount) {
      return res.status(400).json({
        error: "Family number, year, and amount are required"
      });
    }

    // Check if subscription already exists for this family and year
    const existingSubscription = await Subscription.findOne({
      family_number,
      year
    });

    if (existingSubscription) {
      return res.status(409).json({
        error: `Subscription for year ${year} already exists for this family`
      });
    }

    // Get last subscription to check if amount is decreasing
    const lastSubscription = await Subscription.findOne({ family_number })
      .sort({ year: -1 });

    if (lastSubscription && amount < lastSubscription.amount) {
      return res.status(400).json({
        error: `Amount cannot be decreased. Minimum amount: ₹${lastSubscription.amount}`
      });
    }

    // Create new subscription
    const subscription = new Subscription(req.body);
    await subscription.save();

    res.status(201).json({
      message: "Subscription added successfully",
      subscription
    });
  } catch (err) {
    console.error("Error adding subscription:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: "Subscription for this family and year already exists"
      });
    }

    res.status(400).json({ error: err.message });
  }
});

// 📜 GET - Get All Subscriptions
router.get("/", async (req, res) => {
  try {
    const { year, family_number } = req.query;
    let query = {};

    if (year) query.year = parseInt(year);
    if (family_number) query.family_number = family_number;

    const subscriptions = await Subscription.find(query)
      .sort({ year: -1, paid_date: -1 });

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GENERIC /:id ROUTES - Must be LAST

// Get One Subscription
router.get("/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Subscription
router.put("/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // If amount is being changed, check it's not decreased
    if (req.body.amount && req.body.amount < subscription.amount) {
      return res.status(400).json({
        error: "Amount cannot be decreased"
      });
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedSubscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Subscription
router.delete("/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ message: "Subscription deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
