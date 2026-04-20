import express from "express";
import mongoose from "mongoose";
import Family from "../models/Family.js";
import Subscription from "../models/Subscription.js";
import Member from "../models/Member.js";

const router = express.Router();


// ✅ CREATE FAMILY
router.post("/", async (req, res) => {

  try {

    const exists = await Family.findOne({
      family_number: req.body.family_number
    });

    if (exists) {
      return res.status(400).json({
        error: "Family number already exists"
      });
    }

    const familyPayload = {
      family_number: req.body.family_number,
      name: req.body.name,
      hof: req.body.hof,
      count: req.body.count,
      location: req.body.location,
      village: req.body.village,
      contact_number: req.body.contact_number,
      family_unit: req.body.family_unit,
      ward_number: req.body.ward_number,
      subscription: req.body.subscription,
      subscription_amount: req.body.subscription_amount
    };

    const family = new Family(familyPayload);

    await family.save();

    res.status(201).json({
      message: "Family added successfully",
      family
    });

  } catch (err) {
    console.error("Error creating family:", err);
    res.status(400).json({
      error: "Invalid family data"
    });

  }

});



// ✅ GET ALL FAMILIES
router.get("/", async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const skip = (page - 1) * limit;

    const families = await Family.find()
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(families);

  } catch (err) {
    console.error("Error fetching families:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ GET UNIQUE BLOCKS
router.get("/blocks/list", async (req, res) => {

  try {

    const blocks = await Family.distinct("ward_number");

    const filtered = blocks.filter(
      block => block && block.trim() !== ""
    );

    res.json(filtered);

  } catch (err) {
    console.error("Error fetching blocks:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ GET UNIQUE UNITS
router.get("/units/list", async (req, res) => {

  try {

    const units = await Family.distinct("family_unit");

    const filtered = units.filter(
      unit => unit && unit.trim() !== ""
    );

    res.json(filtered);

  } catch (err) {
    console.error("Error fetching units:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ GET FAMILY BY FAMILY NUMBER
router.get("/number/:family_number", async (req, res) => {

  try {

    const family = await Family.findOne({
      family_number: req.params.family_number
    }).lean();

    if (!family) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json(family);

  } catch (err) {
    console.error("Error fetching family by number:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ UPDATE FAMILY SUBSCRIPTION AMOUNT (admin override)
router.put("/:id/subscription-amount", async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid ID format"
      });
    }

    const { subscription_amount } = req.body;

    if (subscription_amount === undefined || subscription_amount === null) {
      return res.status(400).json({
        error: "subscription_amount is required"
      });
    }

    const amount = Number(subscription_amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "subscription_amount must be a positive number"
      });
    }

    const family = await Family.findByIdAndUpdate(
      req.params.id,
      { subscription_amount: amount },
      { new: true, runValidators: true }
    );

    if (!family) {
      return res.status(404).json({
        error: "Family not found"
      });
    }

    // Also update all existing unpaid subscription records for this family
    const updateResult = await Subscription.updateMany(
      { family_number: family.family_number, paid: false },
      { $set: { amount: amount } }
    );

    res.json({
      message: "Subscription amount updated successfully",
      family,
      unpaid_records_updated: updateResult.modifiedCount
    });

  } catch (err) {
    console.error("Error updating subscription amount:", err);
    res.status(400).json({
      error: "Invalid subscription amount"
    });

  }

});



// ✅ GET FAMILY BY ID
router.get("/:id", async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid ID format"
      });
    }

    const family = await Family.findById(req.params.id).lean();

    if (!family) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json(family);

  } catch (err) {
    console.error("Error fetching family by id:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ UPDATE FAMILY
router.put("/:id", async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid ID format"
      });
    }

    const allowedUpdate = {
      family_number: req.body.family_number,
      name: req.body.name,
      hof: req.body.hof,
      count: req.body.count,
      location: req.body.location,
      village: req.body.village,
      contact_number: req.body.contact_number,
      family_unit: req.body.family_unit,
      ward_number: req.body.ward_number,
      subscription: req.body.subscription,
      subscription_amount: req.body.subscription_amount
    };

    const cleanUpdate = Object.fromEntries(
      Object.entries(allowedUpdate).filter(([, value]) => value !== undefined)
    );

    const updated = await Family.findByIdAndUpdate(
      req.params.id,
      cleanUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json({
      message: "Family updated successfully",
      updatedFamily: updated
    });

  } catch (err) {
    console.error("Error updating family:", err);
    res.status(400).json({
      error: "Invalid family update data"
    });

  }

});



// ✅ DELETE FAMILY
router.delete("/:id", async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid ID format"
      });
    }

    const family = await Family.findById(req.params.id).lean();

    if (!family) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    const memberCount = await Member.countDocuments({
      family_number: family.family_number
    });

    if (memberCount > 0) {
      return res.status(409).json({
        error: "Cannot delete family with existing members"
      });
    }

    const deleted = await Family.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json({
      message: "Family deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting family:", err);
    res.status(500).json({
      error: "An internal error occurred"
    });

  }

});



// ✅ UPDATE FAMILY MEMBER COUNT
router.put("/update-count/:family_number", async (req, res) => {

  try {

    const { count } = req.body;

    if (count === undefined || count === null) {
      return res.status(400).json({
        error: "Member count is required"
      });
    }

    const updated = await Family.findOneAndUpdate(
      { family_number: req.params.family_number },
      { count: count },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json({
      message: "Family member count updated successfully",
      family: updated
    });

  } catch (err) {
    console.error("Error updating family count:", err);
    res.status(400).json({
      error: "Invalid member count value"
    });

  }

});


export default router;
