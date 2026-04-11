import express from "express";
import Family from "../models/Family.js";
import Subscription from "../models/Subscription.js";

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

    const family = new Family(req.body);

    await family.save();

    res.status(201).json({
      message: "Family added successfully",
      family
    });

  } catch (err) {

    res.status(400).json({
      error: err.message
    });

  }

});



// ✅ GET ALL FAMILIES
router.get("/", async (req, res) => {

  try {

    const families = await Family.find().lean();

    res.json(families);

  } catch (err) {

    res.status(500).json({
      error: err.message
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

    res.status(500).json({
      error: err.message
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

    res.status(500).json({
      error: err.message
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

    res.status(500).json({
      error: err.message
    });

  }

});



// ✅ UPDATE FAMILY SUBSCRIPTION AMOUNT (admin override)
router.put("/:id/subscription-amount", async (req, res) => {

  try {

    const { subscription_amount } = req.body;

    if (subscription_amount === undefined || subscription_amount === null) {
      return res.status(400).json({
        error: "subscription_amount is required"
      });
    }

    const amount = Number(subscription_amount);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        error: "subscription_amount must be a non-negative number"
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

    res.status(400).json({
      error: err.message
    });

  }

});



// ✅ GET FAMILY BY ID
router.get("/:id", async (req, res) => {

  try {

    const family = await Family.findById(req.params.id).lean();

    if (!family) {

      return res.status(404).json({
        error: "Family not found"
      });

    }

    res.json(family);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});



// ✅ UPDATE FAMILY
router.put("/:id", async (req, res) => {

  try {

    const updated = await Family.findByIdAndUpdate(
      req.params.id,
      req.body,
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

    res.status(400).json({
      error: err.message
    });

  }

});



// ✅ DELETE FAMILY
router.delete("/:id", async (req, res) => {

  try {

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

    res.status(500).json({
      error: err.message
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

    res.status(400).json({
      error: err.message
    });

  }

});


export default router;