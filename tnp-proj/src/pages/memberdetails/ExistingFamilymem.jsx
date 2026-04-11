import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/existingfamadd.css";

const ExistingFamilymem = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [familyInfo, setFamilyInfo] = useState({
    name: "",
    hof: "",
  });

  const [memberCount, setMemberCount] = useState(0);
  const [isCompletionMode, setIsCompletionMode] = useState(false);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    gender: "",
    relation: "",
    dob: "",
    age: "",
    occupation: "",
    phone: "",
    email: "",
    blood_group: "",
    aadhaar: "",
    family_number: "",
    hof: "No",
    baptismStatus: "No",
  });

  // Auto-fill family_number if passed from navigation
  useEffect(() => {
    if (location.state?.family_number) {
      setFormData((prev) => ({
        ...prev,
        family_number: location.state.family_number,
      }));
      fetchFamilyDetails(location.state.family_number);
      
      // Check if coming from Add Family (new family mode)
      if (location.state?.isNewFamily) {
        setIsCompletionMode(true);
        fetchMemberCount(location.state.family_number);
      }
    }
  }, [location.state]);

  // Fetch family details from backend
  const fetchFamilyDetails = async (familyNumber) => {
    try {
      if (!familyNumber) return;
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(
        `${API}/api/families/number/${familyNumber}`
      );
      if (!res.ok) throw new Error("Family not found");
      const data = await res.json();
      setFamilyInfo({
        name: data.name || "",
        hof: data.hof || "",
      });
    } catch (err) {
      console.error("Error fetching family details:", err.message);
      setFamilyInfo({ name: "", hof: "" });
    }
  };

  // Fetch member count for the family
  const fetchMemberCount = async (familyNumber) => {
    try {
      if (!familyNumber) return;
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(
        `${API}/api/members?family_number=${familyNumber}`
      );
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMemberCount(data.length);
    } catch (err) {
      console.error("Error fetching member count:", err.message);
      setMemberCount(0);
    }
  };

  // Handle completion of family member addition
  const handleCompleteAddition = async () => {
    try {
      if (memberCount === 0) {
        alert("⚠️ Please add at least 1 member before completing");
        return;
      }

      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(
        `${API}/api/families/update-count/${formData.family_number}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: memberCount }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update member count");
      }

      alert(`✅ Family member count updated successfully! Total members: ${memberCount}`);
      
      // Navigate to Family Details page
      navigate(`/FamilyDetails/${formData.family_number}`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "family_number") {
      fetchFamilyDetails(value.trim());
    }
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        sl_no: Date.now(),
        name: formData.firstname + " " + formData.lastname,
        gender: formData.gender,
        relation: formData.relation,
        dob: formData.dob,
        age: formData.age ? Number(formData.age) : undefined,
        occupation: formData.occupation,
        phone: formData.phone,
        email: formData.email,
        blood_group: formData.blood_group,
        aadhaar: formData.aadhaar,
        family_number: formData.family_number,
        hof: formData.hof === "Yes",
        baptism: formData.baptismStatus === "Yes",
      };

      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add member");
      }

      alert("✅ Member added successfully!");
      
      // Refresh member count if in completion mode
      if (isCompletionMode) {
        fetchMemberCount(formData.family_number);
      }
      
      setFormData({
        firstname: "",
        lastname: "",
        gender: "",
        relation: "",
        dob: "",
        age: "",
        occupation: "",
        phone: "",
        email: "",
        blood_group: "",
        aadhaar: "",
        family_number: formData.family_number, // keep same family
        hof: "No",
        baptismStatus: "No",
      });
    } catch (err) {
      alert(`❌ Error adding member: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <form className="register-form" onSubmit={handleSubmit}>
        {/* Family Number (First Field) */}
        <div className="input-group">
          <input
            type="text"
            name="family_number"
            value={formData.family_number}
            onChange={handleChange}
            required
          />
          <label>Family Number</label>
        </div>

        {/* Autofilled Family Name & HOF */}
        <div className="name-row">
          <div className="input-group">
            <input type="text" value={familyInfo.name} readOnly />
            <label>Family Name</label>
          </div>
          <div className="input-group">
            <input type="text" value={familyInfo.hof} readOnly />
            <label>Head of Family</label>
          </div>
        </div>

        {/* --- Keep all your original fields below --- */}

        {/* Name */}
        <div className="name-row">
          <div className="input-group">
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
            />
            <label>First Name</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
            />
            <label>Last Name</label>
          </div>
        </div>

        {/* Gender & Relation */}
        <div className="name-row">
          <div className="input-group">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value=""></option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <label>Gender</label>
          </div>
          <div className="input-group">
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
            >
              <option value=""></option>
              <optgroup label="Core Family">
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
              </optgroup>
              <optgroup label="Extended Family">
                <option value="Grandfather">Grandfather</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Grandson">Grandson</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Nephew">Nephew</option>
                <option value="Niece">Niece</option>
                <option value="Cousin">Cousin</option>
                <option value="Daughter-in-Law">Daughter-in-Law</option>
                <option value="Son-in-Law">Son-in-Law</option>
              </optgroup>
              <optgroup label="Other">
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </optgroup>
            </select>
            <label>Relation</label>
          </div>
        </div>

        {/* DOB & Age */}
        <div className="name-row">
          <div className="input-group">
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
            <label>Date of Birth</label>
          </div>
          <div className="input-group">
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
            <label>Age</label>
          </div>
        </div>

        {/* Occupation & Phone */}
        <div className="name-row">
          <div className="input-group">
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
            />
            <label>Occupation</label>
          </div>
          <div className="input-group">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <label>Phone</label>
          </div>
        </div>

        {/* Email & Blog Group */}
        <div className="name-row">
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <label>Email</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              name="blood_group"
              value={formData.blood_group}
              onChange={handleChange}
            />
            <label>Blood Group </label>
          </div>
        </div>

        {/* Aadhaar */}
        <div className="input-group">
          <input
            type="text"
            name="aadhaar"
            value={formData.aadhaar}
            onChange={handleChange}
          />
          <label>Aadhaar</label>
        </div>

        {/* Hof & Baptism */}
        <div className="name-row">
          <div className="input-group">
            <select
              name="hof"
              value={formData.hof}
              onChange={handleChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            <label>Head of Family</label>
          </div>
          <div className="input-group">
            <select
              name="baptismStatus"
              value={formData.baptismStatus}
              onChange={handleChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            <label>Baptism</label>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Add Member
        </button>

        {/* Completion Section - Only show when coming from Add Family */}
        {isCompletionMode && (
          <div className="completion-section">
            <div className="member-count-display">
              <span className="count-label">Members Added:</span>
              <span className="count-badge">{memberCount}</span>
            </div>
            <button
              type="button"
              className="complete-btn"
              onClick={handleCompleteAddition}
            >
              Finish
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExistingFamilymem;
