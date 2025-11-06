import express from "express";
import Family from "../models/Family.js";

const router = express.Router();

// Create family
router.post("/", async (req, res) => {
  try {
    const exists = await Family.findOne({ family_number: req.body.family_number });
    if (exists) {
      return res.status(400).json({ error: "Family number already exists" });
    }

    const family = new Family(req.body);
    await family.save();
    res.status(201).json({ message: "Family added successfully", family });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all families
router.get("/", async (req, res) => {
  try {
    const families = await Family.find().lean();
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPECIFIC ROUTE - Must come BEFORE /:id
// Get family by family_number
router.get("/number/:family_number", async (req, res) => {
  try {
    const family = await Family.findOne({ family_number: req.params.family_number }).lean();
    if (!family) return res.status(404).json({ error: "Family not found" });
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GENERIC /:id ROUTES - Must be LAST

// Get single family
router.get("/:id", async (req, res) => {
  try {
    const family = await Family.findById(req.params.id).lean();
    if (!family) return res.status(404).json({ error: "Family not found" });
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update family
router.put("/:id", async (req, res) => {
  try {
    const updatedFamily = await Family.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedFamily) return res.status(404).json({ error: "Family not found" });
    res.json({ message: "Family updated successfully", updatedFamily });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete family
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Family.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Family not found" });
    res.json({ message: "Family deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
