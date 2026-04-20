import express from "express";
import mongoose from "mongoose";
import Baptism from "../models/Baptism.js";
import Counter from "../models/Counter.js";
import Member from "../models/Member.js";
import Family from "../models/Family.js";
import { nextSequence, buildYearRegNo } from "../utils/sequence.js";

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get next available serial number
router.get("/next-sl-no", async (req, res) => {
  try {
    const counter = await Counter.findOne({ key: "baptism:sl_no" }).lean();

    let nextSlNo = (counter?.seq || 0) + 1;
    if (!counter) {
      const lastRecord = await Baptism.findOne().sort({ sl_no: -1 }).lean();
      nextSlNo = (lastRecord?.sl_no || 0) + 1;
    }

    res.json({ next_sl_no: nextSlNo });
  } catch (err) {
    console.error("Error fetching next baptism serial:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Search families by name
router.get("/search-families/:searchTerm", async (req, res) => {
  try {
    const searchTerm = String(req.params.searchTerm || "").trim();
    if (!searchTerm) {
      return res.json([]);
    }

    const safePattern = escapeRegex(searchTerm.slice(0, 64));

    const families = await Family.find({
      name: { $regex: safePattern, $options: "i" }
    }).limit(20);

    res.json(families);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Get heads of family by family name
router.get("/heads-of-family/:familyName", async (req, res) => {
  try {
    const familyName = String(req.params.familyName || "").trim();
    if (!familyName) {
      return res.json([]);
    }

    const safeName = escapeRegex(familyName.slice(0, 64));

    // Get all families with this name
    const families = await Family.find({
      name: { $regex: `^${safeName}$`, $options: "i" }
    });

    res.json(families);
  } catch (err) {
    console.error("Error fetching heads of family:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Get unbaptized members by family number
router.get("/unbaptized-members/:familyNumber", async (req, res) => {
  try {
    const familyNumber = req.params.familyNumber;

    // Get unbaptized members
    const unbaptizedMembers = await Member.find({
      family_number: familyNumber,
      baptism: false,
      deceased: { $ne: true }  // Not true (includes false, null, undefined)
    }).sort({ dob: -1 });

    res.json(unbaptizedMembers);
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Utility route: Check member baptism status
router.get("/check-member/:memberId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.memberId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const member = await Member.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const baptismRecord = await Baptism.findOne({ member_id: req.params.memberId });

    res.json({
      member: {
        name: member.name,
        baptism_field: member.baptism
      },
      has_baptism_record: !!baptismRecord,
      baptism_record: baptismRecord || null,
      status: baptismRecord ? "Baptized" : "Not Baptized"
    });
  } catch (err) {
    console.error("Error checking member baptism:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Utility route: Fix inconsistent baptism status
router.post("/fix-baptism-status", async (req, res) => {
  try {
    // Get all baptism records
    const baptisms = await Baptism.find();

    let fixed = 0;
    for (const baptism of baptisms) {
      const member = await Member.findById(baptism.member_id);
      if (member && member.baptism !== true) {
        member.baptism = true;
        await member.save();
        fixed++;
      }
    }

    // Get all members marked as baptized but have no record
    const baptizedMembers = await Member.find({ baptism: true });
    let unmarked = 0;

    for (const member of baptizedMembers) {
      const baptismRecord = await Baptism.findOne({ member_id: member._id });
      if (!baptismRecord) {
        // This member is marked baptized but has no record
        // Optionally uncomment to auto-fix:
        // member.baptism = false;
        // await member.save();
        // unmarked++;
      }
    }

    res.json({
      message: "Baptism status check completed",
      members_fixed: fixed,
      members_without_records: unmarked,
      total_baptism_records: baptisms.length
    });
  } catch (err) {
    console.error("Error fixing baptism status:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Create new baptism record
router.post("/", async (req, res) => {
  try {
    const payload = {
      isParishioner: req.body.isParishioner,
      member_id: req.body.member_id,
      member_name: req.body.member_name,
      member_dob: req.body.member_dob,
      gender: req.body.gender,
      home_parish: req.body.home_parish,
      address: req.body.address,
      father_name: req.body.father_name,
      mother_name: req.body.mother_name,
      date_of_baptism: req.body.date_of_baptism,
      place_of_baptism: req.body.place_of_baptism,
      church_where_baptised: req.body.church_where_baptised,
      bapt_name: req.body.bapt_name,
      godparent_name: req.body.godparent_name,
      godparent_house_name: req.body.godparent_house_name,
      baptised_by: req.body.baptised_by,
      certificate_number: req.body.certificate_number,
      remarks: req.body.remarks
    };

    const {
      isParishioner,
      member_id,
      member_name,
      member_dob,
      gender,
      home_parish,
      address,
      father_name,
      mother_name,
      date_of_baptism,
      place_of_baptism,
      church_where_baptised,
      bapt_name,
      godparent_name,
      godparent_house_name,
      baptised_by,
      certificate_number,
      remarks
    } = payload;

    // Auto-generate identifiers
    const now = new Date();
    const nextSlNo = await nextSequence("baptism:sl_no");
    const nextRegSeq = await nextSequence(`baptism:reg:${now.getFullYear()}`);
    const regNo = buildYearRegNo(now, nextRegSeq);

    let baptismData = {
      sl_no: nextSlNo,
      reg_no: regNo,
      isParishioner,
      member_name,
      member_dob,
      gender,
      address,
      father_name,
      mother_name,
      date_of_baptism,
      place_of_baptism,
      church_where_baptised,
      bapt_name,
      godparent_name,
      godparent_house_name,
      baptised_by,
      certificate_number,
      remarks
    };

    // ----------------------------
    // ✅ PARISHIONER FLOW
    // ----------------------------
    if (isParishioner) {
      if (!member_id) {
        return res.status(400).json({ error: "Member ID required for parishioner" });
      }

      if (!mongoose.Types.ObjectId.isValid(member_id)) {
        return res.status(400).json({ error: "Invalid member ID format" });
      }

      const member = await Member.findById(member_id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      if (member.baptism === true) {
        return res.status(400).json({
          error: "This member is already marked as baptized"
        });
      }

      const existingBaptism = await Baptism.findOne({ member_id });
      if (existingBaptism) {
        return res.status(400).json({
          error: "A baptism record already exists for this member"
        });
      }

      const family = await Family.findOne({ family_number: member.family_number });
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }

      baptismData = {
        ...baptismData,
        family_number: family.family_number,
        family_name: family.name,
        hof: family.hof,
        member_id: member._id,
        member_name: member.name,
        member_dob: member.dob,
        gender: member.gender
      };

      // Mark member baptized
      member.baptism = true;
      await member.save();
    }

    // ----------------------------
    // ✅ NON-PARISHIONER FLOW
    // ----------------------------
    if (!isParishioner) {
      baptismData.home_parish = home_parish || "Unknown";
      baptismData.member_id = null;
      baptismData.family_number = null;
      baptismData.family_name = null;
      baptismData.hof = null;
    }

    const baptism = new Baptism(baptismData);
    await baptism.save();

    res.status(201).json({
      message: "Baptism record created successfully",
      data: baptism
    });

  } catch (err) {
    console.error("❌ Error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        error: "Duplicate entry: Serial number already exists"
      });
    }

    res.status(400).json({ error: "Invalid baptism data" });
  }
});


// Get all baptism records
router.get("/", async (req, res) => {
  try {
    const baptisms = await Baptism.find()
      .populate('member_id')
      .sort({ sl_no: -1 });
    res.json(baptisms);
  } catch (err) {
    console.error("Error fetching baptism records:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Get single baptism record
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const baptism = await Baptism.findById(req.params.id)
      .populate('member_id');

    if (!baptism) {
      return res.status(404).json({ error: "Baptism record not found" });
    }

    res.json(baptism);
  } catch (err) {
    console.error("Error fetching baptism by id:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// Update baptism record
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const allowedUpdate = {
      reg_no: req.body.reg_no,
      isParishioner: req.body.isParishioner,
      family_number: req.body.family_number,
      family_name: req.body.family_name,
      hof: req.body.hof,
      member_id: req.body.member_id,
      member_name: req.body.member_name,
      member_dob: req.body.member_dob,
      gender: req.body.gender,
      home_parish: req.body.home_parish,
      address: req.body.address,
      father_name: req.body.father_name,
      mother_name: req.body.mother_name,
      date_of_baptism: req.body.date_of_baptism,
      place_of_baptism: req.body.place_of_baptism,
      church_where_baptised: req.body.church_where_baptised,
      bapt_name: req.body.bapt_name,
      godparent_name: req.body.godparent_name,
      godparent_house_name: req.body.godparent_house_name,
      baptised_by: req.body.baptised_by,
      certificate_number: req.body.certificate_number,
      remarks: req.body.remarks
    };

    const cleanUpdate = Object.fromEntries(
      Object.entries(allowedUpdate).filter(([, value]) => value !== undefined)
    );

    const updatedBaptism = await Baptism.findByIdAndUpdate(
      req.params.id,
      cleanUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedBaptism) {
      return res.status(404).json({ error: "Baptism record not found" });
    }

    res.json({
      message: "Baptism record updated successfully",
      data: updatedBaptism
    });
  } catch (err) {
    console.error("Error updating baptism:", err);
    res.status(400).json({ error: "Invalid baptism update data" });
  }
});

// Delete baptism record
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const baptism = await Baptism.findById(req.params.id);

    if (!baptism) {
      return res.status(404).json({ error: "Baptism record not found" });
    }

    // ✅ Only update Member if parishioner
    if (baptism.member_id) {
      await Member.findByIdAndUpdate(
        baptism.member_id,
        { baptism: false }
      );
    }

    // Delete baptism record
    await Baptism.findByIdAndDelete(req.params.id);

    res.json({
      message: "Baptism record deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting baptism:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});


export default router;
