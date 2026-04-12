import express from "express";
import mongoose from "mongoose";
import Death from "../models/Death.js";
import Member from "../models/Member.js";

const router = express.Router();

// ➕ Add Death Record
router.post("/", async (req, res) => {
  try {
    const payload = {
      isParishioner: req.body.isParishioner,
      memberId: req.body.memberId,
      nextHofId: req.body.nextHofId,
      family_no: req.body.family_no,
      name: req.body.name,
      house_name: req.body.house_name,
      address_place: req.body.address_place,
      father_husband_name: req.body.father_husband_name,
      mother_wife_name: req.body.mother_wife_name,
      death_date: req.body.death_date,
      burial_date: req.body.burial_date,
      age: req.body.age,
      conducted_by: req.body.conducted_by,
      cause_of_death: req.body.cause_of_death,
      cell_no: req.body.cell_no,
      remarks: req.body.remarks,
      block: req.body.block,
      unit: req.body.unit
    };

    const {
      isParishioner,
      memberId,
      nextHofId,
      ...deathData
    } = payload;

    // Auto-generate reg_no: YY/NNNN
    const now = new Date();
    const year2 = String(now.getFullYear()).slice(-2);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const countThisYear = await Death.countDocuments({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    const regNo = `${year2}/${String(countThisYear + 1).padStart(4, '0')}`;
    deathData.reg_no = regNo;

    // Safety net: Double check that no empty strings accidentally got through
    if (deathData.burial_date === "") deathData.burial_date = null;
    if (deathData.age === "") deathData.age = null;

    // ----------------------------
    // ✅ NON-PARISHIONER FLOW
    // ----------------------------
    if (!isParishioner) {
      const newDeath = new Death({
        ...deathData,
        isParishioner: false,
        member_id: null,
        family_no: null
      });

      await newDeath.save();

      return res.status(201).json({
        message: "Non-parishioner death record added successfully",
        death: newDeath
      });
    }

    // ----------------------------
    // ✅ PARISHIONER FLOW
    // ----------------------------
    const familyNumber = deathData.family_no;

    if (!memberId || !familyNumber) {
      return res.status(400).json({
        error: "memberId and family_no are required for parishioner death"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: "Invalid member ID format" });
    }

    const memberToDecease = await Member.findById(memberId);
    if (!memberToDecease) {
      return res.status(404).json({ error: "Member not found" });
    }

    const wasHof = memberToDecease.hof;

    const newDeath = new Death({
      ...deathData,
      isParishioner: true,
      member_id: memberId
    });

    await newDeath.save();

    // Mark member deceased
    await Member.findByIdAndUpdate(memberId, {
      hof: false,
      deceased: true
    });

    // ----------------------------
    // HoF reassignment logic
    // ----------------------------
    if (wasHof) {
      let newHof;

      if (nextHofId) {
        if (!mongoose.Types.ObjectId.isValid(nextHofId)) {
          return res.status(400).json({ error: "Invalid next HOF ID format" });
        }

        newHof = await Member.findByIdAndUpdate(
          nextHofId,
          { hof: true },
          { new: true }
        );

        if (!newHof) {
          return res.status(404).json({
            error: "Selected next HOF not found"
          });
        }
      } else {
        newHof = await Member.findOneAndUpdate(
          {
            family_number: familyNumber,
            _id: { $ne: memberId },
            deceased: { $ne: true }
          },
          { hof: true },
          {
            new: true,
            sort: { dob: 1 } // oldest first
          }
        );
      }
    }

    res.status(201).json({
      message: "Parishioner death record added successfully",
      death: newDeath
    });

  } catch (err) {
    console.error("Error adding death record:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error! A field has incorrect data.",
        details: err.message // This passes exactly which field failed back to the alert
      });
    }

    res.status(500).json({
      error: "An internal error occurred"
    });
  }
});


// 📜 Get All Death Records
router.get("/", async (req, res) => {
  try {
    const deaths = await Death.find().sort({ death_date: -1 });
    res.json(deaths);
  } catch (err) {
    console.error("Error fetching death records:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// 📜 Get One Death Record
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const death = await Death.findById(req.params.id);
    if (!death) {
      return res.status(404).json({ error: "Death record not found" });
    }
    res.json(death);
  } catch (err) {
    console.error("Error fetching death record:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

// ✏️ Update Death Record
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const allowedUpdate = {
      isParishioner: req.body.isParishioner,
      member_id: req.body.member_id,
      family_no: req.body.family_no,
      name: req.body.name,
      house_name: req.body.house_name,
      address_place: req.body.address_place,
      father_husband_name: req.body.father_husband_name,
      mother_wife_name: req.body.mother_wife_name,
      death_date: req.body.death_date,
      burial_date: req.body.burial_date,
      age: req.body.age,
      conducted_by: req.body.conducted_by,
      cause_of_death: req.body.cause_of_death,
      cell_no: req.body.cell_no,
      remarks: req.body.remarks,
      block: req.body.block,
      unit: req.body.unit
    };

    const cleanUpdate = Object.fromEntries(
      Object.entries(allowedUpdate).filter(([, value]) => value !== undefined)
    );

    const updatedDeath = await Death.findByIdAndUpdate(
      req.params.id,
      cleanUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedDeath) {
      return res.status(404).json({ error: "Death record not found" });
    }

    res.json(updatedDeath);
  } catch (err) {
    console.error("Error updating death record:", err);
    res.status(400).json({ error: err.message });
  }
});

// ❌ Delete Death Record
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const record = await Death.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Death record not found" });
    }

    if (record.member_id) {
      await Member.findByIdAndUpdate(record.member_id, {
        deceased: false
      });
    }

    await Death.findByIdAndDelete(req.params.id);

    res.json({ message: "Death record deleted successfully" });
  } catch (err) {
    console.error("Error deleting death record:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

export default router;
