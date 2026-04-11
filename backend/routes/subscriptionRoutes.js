import express from "express";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import Family from "../models/Family.js";

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

// Get Subscription by Family Number — includes virtual unpaid records
router.get("/family/:family_number", async (req, res) => {
  try {
    const familyNumber = req.params.family_number;

    // Fetch real subscription records
    const realSubscriptions = await Subscription.find({
      family_number: familyNumber
    }).lean();

    // Fetch the family to get the current subscription rate
    const family = await Family.findOne({ family_number: familyNumber }).lean();
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    const currentYear = new Date().getFullYear();
    const subscriptionRate = family.subscription_amount || 0;

    // If no real records exist, return empty (no range to generate)
    // unless the family has a subscription_amount set
    if (realSubscriptions.length === 0 && !family.subscription_amount) {
      return res.json({ records: [], family });
    }

    // Determine year range: from earliest real record to current year
    const realYears = realSubscriptions.map(s => s.year);
    const startYear = realYears.length > 0
      ? Math.min(...realYears)
      : currentYear;

    // Build a set of years that have real records
    const realYearSet = new Set(realYears);

    // Generate virtual unpaid records for missing years
    const virtualRecords = [];
    for (let yr = startYear; yr <= currentYear; yr++) {
      if (!realYearSet.has(yr)) {
        virtualRecords.push({
          family_number: familyNumber,
          family_name: family.name,
          hof: family.hof,
          year: yr,
          amount: subscriptionRate,
          paid: false,
          virtual: true
        });
      }
    }

    // Mark real records as non-virtual
    const taggedReal = realSubscriptions.map(s => ({ ...s, virtual: false }));

    // Merge and sort by year descending
    const allRecords = [...taggedReal, ...virtualRecords]
      .sort((a, b) => b.year - a.year);

    res.json({ records: allRecords, family });
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

// ➕ POST - Bulk Pay multiple years (with optional extra_amount)
router.post("/bulk-pay", async (req, res) => {
  try {
    const {
      family_number,
      years,
      amount_per_year,
      extra_amount,
      paid_date,
      payment_method,
      receipt_number,
      notes
    } = req.body;

    // Validate required fields
    if (!family_number || !years || !Array.isArray(years) || years.length === 0 || !amount_per_year) {
      return res.status(400).json({
        error: "family_number, years (array), and amount_per_year are required"
      });
    }

    const amount = Number(amount_per_year);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "amount_per_year must be a positive number" });
    }

    const extra = Number(extra_amount) || 0;

    // Fetch the family
    const family = await Family.findOne({ family_number }).lean();
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    // Validate amount >= family.subscription_amount (business rule)
    if (family.subscription_amount && amount < family.subscription_amount) {
      return res.status(400).json({
        error: `Amount (${amount}) cannot be less than the family's current subscription rate (${family.subscription_amount}). Use the 'Change Subscription Amount' feature to decrease the rate.`
      });
    }

    const created = [];
    const failed = [];

    // Sort years ascending so last_year is the highest
    const sortedYears = [...years].sort((a, b) => a - b);
    const lastYear = sortedYears[sortedYears.length - 1];
    let extra_applied_to_year = extra > 0 ? lastYear : null;

    for (const year of sortedYears) {
      try {
        // Determine amount for this year: last year gets extra on top
        const yearAmount = (year === lastYear) ? amount + extra : amount;

        // Check if a paid subscription already exists for this year
        const existing = await Subscription.findOne({ family_number, year });

        if (existing && existing.paid) {
          failed.push({ year, reason: "Already paid" });
          continue;
        }

        if (existing && !existing.paid) {
          // Update existing unpaid record to paid
          existing.amount = yearAmount;
          existing.paid = true;
          existing.paid_date = paid_date || new Date();
          existing.payment_method = payment_method || "Cash";
          existing.receipt_number = receipt_number || "";
          existing.notes = notes || "";
          await existing.save();
          created.push(existing.toObject());
        } else {
          // Create new subscription record
          const subscription = new Subscription({
            family_number,
            family_name: family.name,
            hof: family.hof,
            year,
            amount: yearAmount,
            paid: true,
            paid_date: paid_date || new Date(),
            payment_method: payment_method || "Cash",
            receipt_number: receipt_number || "",
            notes: notes || ""
          });
          await subscription.save();
          created.push(subscription.toObject());
        }
      } catch (yearErr) {
        failed.push({ year, reason: yearErr.message });
      }
    }

    // Update family subscription_amount to the highest amount paid
    const highestAmount = amount + extra; // last year's amount is always the highest
    if (!family.subscription_amount || highestAmount > family.subscription_amount) {
      await Family.findOneAndUpdate(
        { family_number },
        { subscription_amount: highestAmount }
      );
    }

    res.json({
      success: true,
      created,
      extra_applied_to_year,
      failed
    });
  } catch (err) {
    console.error("Error in bulk-pay:", err);
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

    if (existingSubscription && existingSubscription.paid) {
      return res.status(409).json({
        error: `Subscription for year ${year} already exists for this family`
      });
    }

    // If an unpaid record exists, update it to paid
    if (existingSubscription && !existingSubscription.paid) {
      existingSubscription.amount = amount;
      existingSubscription.paid = true;
      existingSubscription.paid_date = req.body.paid_date || new Date();
      existingSubscription.payment_method = req.body.payment_method || "Cash";
      existingSubscription.receipt_number = req.body.receipt_number || "";
      existingSubscription.notes = req.body.notes || "";
      await existingSubscription.save();

      // Set family subscription_amount if not set yet (first payment)
      const family = await Family.findOne({ family_number });
      if (family && !family.subscription_amount) {
        family.subscription_amount = amount;
        await family.save();
      }

      return res.status(200).json({
        message: "Subscription updated to paid",
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const subscription = new Subscription(req.body);
    await subscription.save();

    // Set family subscription_amount if not set yet (first payment)
    const family = await Family.findOne({ family_number });
    if (family && !family.subscription_amount) {
      family.subscription_amount = amount;
      await family.save();
    }

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

// Update Subscription (admin action — no amount-decrease restriction)
router.put("/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
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

// Delete Subscription — clears Family.subscription_amount if last record is deleted
router.delete("/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Check if this was the last subscription for the family
    let subscription_amount_cleared = false;
    const remaining = await Subscription.countDocuments({
      family_number: subscription.family_number
    });

    if (remaining === 0) {
      await Family.findOneAndUpdate(
        { family_number: subscription.family_number },
        { subscription_amount: null }
      );
      subscription_amount_cleared = true;
    }

    res.json({
      message: "Subscription deleted successfully",
      subscription_amount_cleared
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
