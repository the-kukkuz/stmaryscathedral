import React, { useState, useEffect } from "react";
import "../../css/editmember.css";
import { api } from "../../api";

const EditMember = () => {
  const [families, setFamilies] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [formData, setFormData] = useState({
    family_name: "",
    family_number: "",
    hof: "",
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
    baptismStatus: "No",
  });

  // ✅ Fetch all families on load
  useEffect(() => {
<<<<<<< HEAD
<<<<<<< HEAD
    api.get("/families")
      .then(({ data }) => setFamilies(data))
=======
    fetch("/api/families")
      .then((res) => res.json())
      .then((data) => setFamilies(data))
>>>>>>> 5e2b8a1 (railway config)
=======
    api.get("/families")
      .then(({ data }) => setFamilies(data))
>>>>>>> 98f619a (fixes)
      .catch((err) => console.error("❌ Error fetching families:", err));
  }, []);

  // ✅ Family search suggestion
  const handleFamilyInput = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, family_name: value }));
    if (value.length > 0) {
      const filtered = families.filter((fam) =>
        fam.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredFamilies(filtered);
    } else {
      setFilteredFamilies([]);
      setSelectedFamily(null);
      setMembers([]);
    }
  };

  // ✅ When user clicks a suggestion → populate family name & show HoF dropdown if needed
  const handleSelectFamilyName = (familyName) => {
    setFormData((prev) => ({ ...prev, family_name: familyName }));
    const matches = families.filter(
      (fam) => fam.name.toLowerCase() === familyName.toLowerCase()
    );

    if (matches.length === 1) {
      // Only one family → directly select it
      setSelectedFamily(matches[0]);
      setFormData((prev) => ({
        ...prev,
        family_number: matches[0].family_number,
        hof: matches[0].hof,
      }));
      fetchMembers(matches[0].family_number);
    } else if (matches.length > 1) {
      // Multiple families → user must select HoF
      setSelectedFamily(null);
    }
    setFilteredFamilies([]);
  };

  // ✅ When user chooses HoF
  const handleSelectHof = (hofName) => {
    const fam = families.find(
      (f) =>
        f.name.toLowerCase() === formData.family_name.toLowerCase() &&
        f.hof === hofName
    );
    if (fam) {
      setSelectedFamily(fam);
      setFormData((prev) => ({
        ...prev,
        family_number: fam.family_number,
        hof: fam.hof,
      }));
      fetchMembers(fam.family_number);
    }
  };

  // ✅ Fetch members for a family
  const fetchMembers = async (family_number) => {
    try {
<<<<<<< HEAD
<<<<<<< HEAD
      const { data } = await api.get(`/members?family_number=${family_number}`);
=======
      const res = await fetch(
        `/api/members?family_number=${family_number}`
      );
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
>>>>>>> 5e2b8a1 (railway config)
=======
      const { data } = await api.get(`/members?family_number=${family_number}`);
>>>>>>> 98f619a (fixes)
      setMembers(data);
    } catch (err) {
      console.error(err);
      alert("❌ Error fetching members");
    }
  };

  // ✅ Select member
  const handleSelectMember = (memberId) => {
    setSelectedMember(memberId);
    const memberObj = members.find((m) => m._id === memberId);

    if (memberObj) {
      const nameParts = memberObj.name?.split(" ") || [];

      setFormData((prev) => ({
        ...prev,
        firstname: nameParts[0] || "",
        lastname: nameParts.slice(1).join(" ") || "",
        gender: memberObj.gender || "",
        relation: memberObj.relation || "",
        dob: memberObj.dob ? memberObj.dob.split("T")[0] : "",
        age: memberObj.age || "",
        occupation: memberObj.occupation || "",
        phone: memberObj.phone || "",
        email: memberObj.email || "",

        blood_group: memberObj.blood_group || "",

        aadhaar: memberObj.aadhaar || "",
        hof: memberObj.hof ? "Yes" : "No",
        baptismStatus: memberObj.baptism ? "Yes" : "No",
      }));
    }
  };

  // ✅ Handle typing in form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMember) {
        alert("⚠️ Please select a member to edit");
        return;
      }

      const payload = {
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

<<<<<<< HEAD
<<<<<<< HEAD
      await api.put(`/members/${selectedMember}`, payload);
=======
      const res = await fetch(
        `/api/members/${selectedMember}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update member");
>>>>>>> 5e2b8a1 (railway config)
=======
      await api.put(`/members/${selectedMember}`, payload);
>>>>>>> 98f619a (fixes)
      alert("✅ Member updated successfully!");
    } catch (err) {
      alert(`❌ Error updating member: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <h2>Edit Member</h2>

      <form className="register-form" onSubmit={handleSubmit}>
        {/* 🔎 Family Name with Suggestions */}
        <div className="input-group">
          <input
            type="text"
            name="family_name"
            value={formData.family_name}
            onChange={handleFamilyInput}
            autoComplete="off"
            required
          />
          <label>Family Name</label>
          {filteredFamilies.length > 0 && (
            <ul className="suggestions">
              {filteredFamilies.map((fam) => (
                <li key={fam._id} onClick={() => handleSelectFamilyName(fam.name)}>
                  {fam.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 👤 HoF Dropdown if multiple families with same name */}
        {families.filter(
          (f) => f.name.toLowerCase() === formData.family_name.toLowerCase()
        ).length > 1 && (
            <div className="input-group">
              <select
                value={selectedFamily?.hof || ""}
                onChange={(e) => handleSelectHof(e.target.value)}
                required
              >
                <option value="">-- Select Head of Family --</option>
                {families
                  .filter(
                    (f) => f.name.toLowerCase() === formData.family_name.toLowerCase()
                  )
                  .map((fam) => (
                    <option key={fam._id} value={fam.hof}>
                      {fam.hof}
                    </option>
                  ))}
              </select>
              <label>Head of Family</label>
            </div>
          )}

        {/* 👥 Member Dropdown */}
        {members.length > 0 && (
          <div className="input-group">
            <select
              value={selectedMember}
              onChange={(e) => handleSelectMember(e.target.value)}
              required
            >
              <option value="">-- Select Member to Edit --</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} {m.hof ? "(HoF)" : ""}
                </option>
              ))}
            </select>
            <label>Select Member</label>
          </div>
        )}

        {/* Continuous Input Fields */}
        <div className="name-row">
          <div className="input-group">
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
            />
            <label>First Name</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
            />
            <label>Last Name</label>
          </div>
        </div>

        <div className="name-row">
          <div className="input-group">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
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
            <label>Blood Group</label>
          </div>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="aadhaar"
            value={formData.aadhaar}
            onChange={handleChange}
          />
          <label>Aadhaar</label>
        </div>

        <div className="name-row">
          <div className="input-group">
            <select
              name="hof"
              value={formData.hof}
              onChange={handleChange}
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
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            <label>Baptism</label>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Update Member
        </button>
      </form>
    </div>
  );
};

export default EditMember;
