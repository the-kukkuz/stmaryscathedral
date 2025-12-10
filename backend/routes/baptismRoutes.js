import express from "express";
import Baptism from "../models/Baptism.js";
import Member from "../models/Member.js";
import Family from "../models/Family.js";

const router = express.Router();

// Get next available serial number
router.get("/next-sl-no", async (req, res) => {
  try {
    const lastRecord = await Baptism.findOne().sort({ sl_no: -1 });
    const nextSlNo = lastRecord ? lastRecord.sl_no + 1 : 1;
    res.json({ next_sl_no: nextSlNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search families by name
router.get("/search-families/:searchTerm", async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    console.log("Searching for:", searchTerm); // Debug log
    
    const families = await Family.find({
      name: { $regex: searchTerm, $options: 'i' }
    }).limit(20);
    
    console.log("Found families:", families.length); // Debug log
    res.json(families);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get heads of family by family name
router.get("/heads-of-family/:familyName", async (req, res) => {
  try {
    const familyName = req.params.familyName;
    
    // Get all families with this name
    const families = await Family.find({ 
      name: { $regex: `^${familyName}$`, $options: 'i' } 
    });
    
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unbaptized members by family number
router.get("/unbaptized-members/:familyNumber", async (req, res) => {
  try {
    const familyNumber = req.params.familyNumber;
    console.log("========================================");
    console.log("Fetching unbaptized members for family:", familyNumber);
    
    // First, get ALL members from this family to debug
    const allMembers = await Member.find({ family_number: familyNumber });
    console.log(`Total members in family ${familyNumber}:`, allMembers.length);
    
    allMembers.forEach(m => {
      console.log(`- ${m.name}: baptism=${m.baptism}, deceased=${m.deceased}`);
    });
    
    // Get unbaptized members
    const unbaptizedMembers = await Member.find({
      family_number: familyNumber,
      baptism: false,
      deceased: { $ne: true }  // Not true (includes false, null, undefined)
    }).sort({ dob: -1 });
    
    console.log(`Unbaptized members found: ${unbaptizedMembers.length}`);
    unbaptizedMembers.forEach(m => {
      console.log(`✓ ${m.name} (${m.gender})`);
    });
    console.log("========================================");
    
    res.json(unbaptizedMembers);
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: err.message });
  }
});

// Utility route: Check member baptism status
router.get("/check-member/:memberId", async (req, res) => {
  try {
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
    res.status(500).json({ error: err.message });
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
        console.log(`Member ${member.name} marked baptized but has no record`);
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
    res.status(500).json({ error: err.message });
  }
});

// Create new baptism record
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received baptism data:", req.body);
    
    const {
      member_id,
      date_of_baptism,
      place_of_baptism,
      church_where_baptised,
      bapt_name,
      godparent_name,
      godparent_house_name,
      certificate_number,
      remarks
    } = req.body;

    // Get member details
    const member = await Member.findById(member_id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Check if member is already marked as baptized
    if (member.baptism === true) {
      return res.status(400).json({ 
        error: "This member is already marked as baptized in the member records" 
      });
    }

    // Check if baptism record already exists
    const existingBaptism = await Baptism.findOne({ member_id: member_id });
    if (existingBaptism) {
      return res.status(400).json({ 
        error: "A baptism record already exists for this member" 
      });
    }

    // Get family details
    const family = await Family.findOne({ family_number: member.family_number });
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    // Get next serial number
    const lastRecord = await Baptism.findOne().sort({ sl_no: -1 });
    const nextSlNo = lastRecord ? lastRecord.sl_no + 1 : 1;

    // Create baptism record
    const baptismData = {
      sl_no: nextSlNo,
      family_number: family.family_number,
      family_name: family.name,
      hof: family.hof,
      member_id: member._id,
      member_name: member.name,
      member_dob: member.dob,
      gender: member.gender,
      date_of_baptism,
      place_of_baptism,
      church_where_baptised,
      bapt_name,
      godparent_name,
      godparent_house_name,
      certificate_number,
      remarks
    };

    const baptism = new Baptism(baptismData);
    await baptism.save();

    // Update member's baptism status to true
    member.baptism = true;
    await member.save();

    console.log("✅ Baptism saved:", baptism);
    res.status(201).json({
      message: "Baptism record created successfully",
      data: baptism
    });
  } catch (err) {
    console.error("❌ Error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: `Duplicate entry: Serial number already exists` 
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(400).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Get single baptism record
router.get("/:id", async (req, res) => {
  try {
    const baptism = await Baptism.findById(req.params.id)
      .populate('member_id');
    
    if (!baptism) {
      return res.status(404).json({ error: "Baptism record not found" });
    }
    
    res.json(baptism);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update baptism record
router.put("/:id", async (req, res) => {
  try {
    const updatedBaptism = await Baptism.findByIdAndUpdate(
      req.params.id, 
      req.body, 
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
    res.status(400).json({ error: err.message });
  }
});

// Delete baptism record
router.delete("/:id", async (req, res) => {
  try {
    const baptism = await Baptism.findById(req.params.id);
    
    if (!baptism) {
      return res.status(404).json({ error: "Baptism record not found" });
    }

    // Update member's baptism status back to false
    await Member.findByIdAndUpdate(baptism.member_id, { baptism: false });

    // Delete baptism record
    await Baptism.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: "Baptism record deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
