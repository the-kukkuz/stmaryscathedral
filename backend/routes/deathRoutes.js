import express from "express";
import mongoose from "mongoose";
import Death from "../models/Death.js";
import Member from "../models/Member.js";
import Family from "../models/Family.js";
import { nextSequence, buildYearRegNo } from "../utils/sequence.js";

const router = express.Router();

const makeError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const syncFamilyLeadership = async ({ familyNumber, session = null, preferredHofId = null }) => {
  let livingQuery = Member.find({
    family_number: familyNumber,
    deceased: { $ne: true }
  }).sort({ dob: 1 });

  if (session) {
    livingQuery = livingQuery.session(session);
  }

  const livingMembers = await livingQuery;

  const memberUpdateOpts = session ? { session } : {};
  const familyUpdateOpts = session ? { session, runValidators: true } : { runValidators: true };

  if (livingMembers.length === 0) {
    await Member.updateMany(
      { family_number: familyNumber },
      { hof: false },
      memberUpdateOpts
    );

    await Family.findOneAndUpdate(
      { family_number: familyNumber },
      { hof: null, status: "closed" },
      familyUpdateOpts
    );

    return;
  }

  let selectedHof = null;

  if (preferredHofId) {
    selectedHof = livingMembers.find((member) => String(member._id) === String(preferredHofId));
    if (!selectedHof) {
      throw makeError(404, "Selected next HOF not found");
    }
  }

  if (!selectedHof) {
    selectedHof = livingMembers.find((member) => member.hof === true) || livingMembers[0];
  }

  await Member.updateMany(
    { family_number: familyNumber },
    { hof: false },
    memberUpdateOpts
  );

  await Member.findByIdAndUpdate(
    selectedHof._id,
    { hof: true },
    memberUpdateOpts
  );

  await Family.findOneAndUpdate(
    { family_number: familyNumber },
    { hof: selectedHof.name, status: "active" },
    familyUpdateOpts
  );
};

// ➕ Add Death Record
router.post("/", async (req, res) => {
  let session;

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

    // Auto-generate reg_no: YY/NNNN (atomic sequence)
    const now = new Date();
    const nextRegSeq = await nextSequence(`death:reg:${now.getFullYear()}`);
    const regNo = buildYearRegNo(now, nextRegSeq);
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

    session = await mongoose.startSession();

    let savedDeath = null;

    await session.withTransaction(async () => {
      const memberToDecease = await Member.findById(memberId).session(session);

      if (!memberToDecease) {
        throw makeError(404, "Member not found");
      }

      if (memberToDecease.deceased === true) {
        throw makeError(409, "Death record already exists for this member");
      }

      const wasHof = memberToDecease.hof;

      const newDeath = new Death({
        ...deathData,
        isParishioner: true,
        member_id: memberId
      });

      await newDeath.save({ session });
      savedDeath = newDeath;

      memberToDecease.hof = false;
      memberToDecease.deceased = true;
      await memberToDecease.save({ session });

      let preferredHofId = null;
      if (wasHof && nextHofId) {
        if (!mongoose.Types.ObjectId.isValid(nextHofId)) {
          throw makeError(400, "Invalid next HOF ID format");
        }

        preferredHofId = nextHofId;
      }

      await syncFamilyLeadership({
        familyNumber,
        session,
        preferredHofId
      });
    });

    res.status(201).json({
      message: "Parishioner death record added successfully",
      death: savedDeath
    });

  } catch (err) {
    console.error("Error adding death record:", err);

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error! A field has incorrect data."
      });
    }

    res.status(500).json({
      error: "An internal error occurred"
    });
  } finally {
    if (session) {
      await session.endSession();
    }
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
    res.status(400).json({ error: "Invalid death record data" });
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
      const restoredMember = await Member.findByIdAndUpdate(record.member_id, {
        deceased: false
      }, {
        new: true
      });

      if (restoredMember?.family_number) {
        await syncFamilyLeadership({ familyNumber: restoredMember.family_number });
      }
    }

    await Death.findByIdAndDelete(req.params.id);

    res.json({ message: "Death record deleted successfully" });
  } catch (err) {
    console.error("Error deleting death record:", err);
    res.status(500).json({ error: "An internal error occurred" });
  }
});

export default router;
