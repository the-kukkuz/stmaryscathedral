import express from "express";
import Marriage from "../models/Marriage.js";
import Member from "../models/Member.js";

const router = express.Router();

// ➕ Add Marriage Record
router.post("/", async (req, res) => {
  try {
    const { spouse1_id, spouse2_id, marriage_id, date, place, officiant_number } = req.body;

    // Validation
    if (!spouse1_id || !spouse2_id) {
      return res.status(400).json({ 
        error: "Both spouse IDs are required" 
      });
    }

    if (spouse1_id === spouse2_id) {
      return res.status(400).json({ 
        error: "Spouses cannot be the same person" 
      });
    }

    // Check if members exist
    const spouse1 = await Member.findById(spouse1_id);
    const spouse2 = await Member.findById(spouse2_id);

    if (!spouse1 || !spouse2) {
      return res.status(404).json({ 
        error: "One or both members not found" 
      });
    }

    // Check if either is deceased
    if (spouse1.deceased || spouse2.deceased) {
      return res.status(400).json({ 
        error: "Cannot register marriage for deceased members" 
      });
    }

    // Check if marriage_id already exists
    const existingMarriage = await Marriage.findOne({ marriage_id });
    if (existingMarriage) {
      return res.status(409).json({ 
        error: "Marriage ID already exists" 
      });
    }

    // Create marriage record
    const marriage = new Marriage({
      marriage_id,
      spouse1_id,
      spouse1: spouse1.name,
      spouse2_id,
      spouse2: spouse2.name,
      date,
      place,
      officiant_number
    });

    await marriage.save();

    // Update member records to reflect marital status
    await Member.findByIdAndUpdate(spouse1_id, { 
      marital_status: "Married",
      spouse_id: spouse2_id,
      spouse_name: spouse2.name
    });
    
    await Member.findByIdAndUpdate(spouse2_id, { 
      marital_status: "Married",
      spouse_id: spouse1_id,
      spouse_name: spouse1.name
    });

    res.status(201).json({ 
      message: "Marriage record added successfully",
      marriage 
    });
  } catch (err) {
    console.error("Error adding marriage:", err);
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: "Duplicate marriage ID" 
      });
    }
    
    res.status(400).json({ error: err.message });
  }
});

// 📜 Get All Marriages
router.get("/", async (req, res) => {
  try {
    const marriages = await Marriage.find()
      .populate('spouse1_id', 'name phone family_number')
      .populate('spouse2_id', 'name phone family_number')
      .sort({ date: -1 });
    res.json(marriages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Search marriages by spouse name
router.get("/search/:name", async (req, res) => {
  try {
    const searchName = req.params.name;
    const marriages = await Marriage.find({
      $or: [
        { spouse1: { $regex: searchName, $options: 'i' } },
        { spouse2: { $regex: searchName, $options: 'i' } }
      ]
    }).sort({ date: -1 });
    
    res.json(marriages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Get marriages by date range
router.get("/date-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const marriages = await Marriage.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 });
    
    res.json(marriages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Get marriages by year
router.get("/year/:year", async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    const marriages = await Marriage.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });
    
    res.json(marriages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Get Marriage Statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalMarriages = await Marriage.countDocuments();
    const currentYear = new Date().getFullYear();
    
    const marriagesThisYear = await Marriage.countDocuments({
      date: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });
    
    const marriagesByYear = await Marriage.aggregate([
      {
        $group: {
          _id: { $year: "$date" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      totalMarriages,
      marriagesThisYear,
      marriagesByYear
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📜 Get One Marriage
router.get("/:id", async (req, res) => {
  try {
    const marriage = await Marriage.findById(req.params.id)
      .populate('spouse1_id')
      .populate('spouse2_id');
      
    if (!marriage) {
      return res.status(404).json({ error: "Marriage not found" });
    }
    
    res.json(marriage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update Marriage Record
router.put("/:id", async (req, res) => {
  try {
    const updatedMarriage = await Marriage.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedMarriage) {
      return res.status(404).json({ error: "Marriage not found" });
    }
    
    res.json(updatedMarriage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ❌ Delete Marriage Record
router.delete("/:id", async (req, res) => {
  try {
    const marriage = await Marriage.findByIdAndDelete(req.params.id);
    
    if (!marriage) {
      return res.status(404).json({ error: "Marriage not found" });
    }

    // Update member records to remove marital status
    await Member.findByIdAndUpdate(marriage.spouse1_id, { 
      marital_status: "Single",
      $unset: { spouse_id: 1, spouse_name: 1 }
    });
    
    await Member.findByIdAndUpdate(marriage.spouse2_id, { 
      marital_status: "Single",
      $unset: { spouse_id: 1, spouse_name: 1 }
    });
    
    res.json({ message: "Marriage record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
