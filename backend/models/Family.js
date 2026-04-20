import mongoose from "mongoose";

const familySchema = new mongoose.Schema({

  family_number: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  hof: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["active", "closed"],
    default: "active",
    index: true
  },

  count: {
    type: Number
  },

  location: {
    type: String
  },

  village: {
    type: String
  },

  contact_number: {
    type: String
  },

  // ✅ THIS IS YOUR ACTUAL UNIT FIELD
  family_unit: {
    type: String,
    default: ""
  },

  // ✅ THIS IS YOUR BLOCK FIELD
  ward_number: {
    type: String,
    default: ""
  },

  subscription: {
    type: Boolean,
    default: false
  },

  subscription_amount: {
    type: Number,
    default: null
  }

}, {
  timestamps: true
});

export default mongoose.model("Family", familySchema);
