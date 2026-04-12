import express from "express";
import mongoose from "mongoose";
import Member from "../models/Member.js";

const router = express.Router();

// Create new member
router.post("/", async (req, res) => {
  try {
    const payload = {
      sl_no: req.body.sl_no,
      name: req.body.name,
      gender: req.body.gender,
      relation: req.body.relation,
      dob: req.body.dob,
      age: req.body.age,
      occupation: req.body.occupation,
      phone: req.body.phone,
      email: req.body.email,
      blood_group: req.body.blood_group,
      aadhaar: req.body.aadhaar,
      family_number: req.body.family_number,
      hof: req.body.hof,
      baptism: req.body.baptism,
      deceased: req.body.deceased
    };

    const newMember = new Member(payload);
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    console.error("Error creating member:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all members or members by family_number
router.get("/", async (req, res) => {
  try {
    const { family_number } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    let query = {};
    if (family_number) {
      query.family_number = family_number;
    }

    const members = await Member.find(query)
      .select("-aadhaar")
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(members);
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Get single member by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    console.error("Error fetching member:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Update member
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const updateData = {
      name: req.body.name,
      gender: req.body.gender,
      relation: req.body.relation,
      dob: req.body.dob,
      age: req.body.age,
      occupation: req.body.occupation,
      phone: req.body.phone,
      email: req.body.email,

      blood_group: req.body.blood_group,
      aadhaar: req.body.aadhaar,
      family_number: req.body.family_number,
      baptism: req.body.baptism,
      deceased: req.body.deceased
    };

    const cleanUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      cleanUpdate,
      { new: true }
    );

    res.json(updatedMember);

  } catch (err) {
    console.error("Error updating member:", err);
    res.status(400).json({ error: err.message });
  }
});
// Delete member
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error("Error deleting member:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

export default router;
