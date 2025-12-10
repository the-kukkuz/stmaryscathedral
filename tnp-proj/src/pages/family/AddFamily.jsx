import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom"; // 🔹 import navigate

const AddFamily = () => {
  const [form, setForm] = useState({
    family_number: "",
    name: "",
    hof: "",
    count: "",
    location: "",
    village: "",
    contact_number: "",
    family_unit: "",
    ward_number: "",
    unit_number: ""
  });

  const navigate = useNavigate(); // 🔹 create navigate hook

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("https://stmaryscathedral.onrender.com/api/families", form);

    if (res.status === 201 || res.status === 200) {
      alert("✅ Family added successfully!");
      navigate("/ExistingFamilymem", { state: { family_number: form.family_number } });
    } else {
      alert("⚠️ Family could not be added. Please try again.");
    }
  } catch (err) {
    console.error("Error adding family:", err.response?.data || err.message);
    alert("❌ Error: " + (err.response?.data?.error || err.message));
  }
};


  return (
    
    <div className="container">
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input type="text" name="ward_number" value={form.ward_number} onChange={handleChange} />
          <label>Block Number</label>
        </div>

        <div className="input-group">
          <input type="text" name="unit_number" value={form.unit_number} onChange={handleChange} />
          <label>Unit Number</label>
        </div>
        <div className="input-group">
          <input type="text" name="family_number" value={form.family_number} onChange={handleChange} required />
          <label>Family Number</label>
        </div>

        <div className="input-group">
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
          <label>Family Name</label>
        </div>

        <div className="input-group">
          <input type="text" name="hof" value={form.hof} onChange={handleChange} required />
          <label>Head of Family</label>
        </div>

        <div className="input-group">
          <input type="number" name="count" value={form.count} onChange={handleChange} />
          <label>Member Count</label>
        </div>

        <div className="input-group">
          <input type="text" name="location" value={form.location} onChange={handleChange} />
          <label>Location</label>
        </div>

        <div className="input-group">
          <input type="text" name="village" value={form.village} onChange={handleChange} />
          <label>Village</label>
        </div>

        <div className="input-group">
          <input type="text" name="contact_number" value={form.contact_number} onChange={handleChange} />
          <label>Contact Number</label>
        </div>

        <div className="input-group">
          <input type="text" name="family_unit" value={form.family_unit} onChange={handleChange} />
          <label>Kudumb Unit Name</label>
        </div>



        <button type="submit" className="submit-btn">Submit</button>
      </form>
    </div>
  );
};

export default AddFamily;
