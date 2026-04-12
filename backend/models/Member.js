import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  sl_no: { type: Number, required: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  relation: { type: String },
  dob: { type: Date },
  age: { type: Number },
  occupation: { type: String },
  phone: { type: String },
  email: { type: String },

  blood_group: { type: String }, 

  aadhaar: { type: String },
  family_number: { type: String, required: true },
  hof: { type: Boolean, default: false },
  baptism: { type: Boolean, default: false },
  deceased: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Member", memberSchema);