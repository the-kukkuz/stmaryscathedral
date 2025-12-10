import React, { useState, useEffect } from "react";
import "../../css/deathadd.css";

const AddDeathRecord = () => {
  const [families, setFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedHof, setSelectedHof] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isHof, setIsHof] = useState(false);
  const [nextHof, setNextHof] = useState("");

  const [formData, setFormData] = useState({
    sl_no: "",
    name: "",
    house_name: "",
    address_place: "",
    father_husband_name: "",
    mother_wife_name: "",
    death_date: "",
    burial_date: "",
    age: "",
    conducted_by: "", // ✅ Changed from 'church' to match schema
    cause_of_death: "",
    cell_no: "",
    remarks: "",
  });

  // Fetch families on mount
  useEffect(() => {
    fetch("https://stmaryscathedral.onrender.com/api/families")
      .then((res) => res.json())
      .then((data) => setFamilies(data))
      .catch((err) => console.error("Error fetching families:", err));
  }, []);

  // Filter families by name
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFamilies([]);
    } else {
      setFilteredFamilies(
        families.filter((fam) =>
          fam.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, families]);

  // Fetch members when family selected
  useEffect(() => {
    if (selectedHof) {
      fetch(`https://stmaryscathedral.onrender.com/api/members?family_number=${selectedFamily.family_number}`)
        .then((res) => res.json())
        .then((data) => setMembers(data))
        .catch((err) => console.error("Error fetching members:", err));
    }
  }, [selectedHof, selectedFamily]);

  // Autofill when member selected
  useEffect(() => {
    if (selectedMember) {
      const memberObj = members.find((m) => m._id === selectedMember);
      if (memberObj) {
        setFormData((prev) => ({
          ...prev,
          name: memberObj.name || "",
          house_name: memberObj.house_name || "",
          address_place: memberObj.address || "",
          father_husband_name:
            memberObj.father_name || memberObj.husband_name || "",
          mother_wife_name: memberObj.mother_name || memberObj.wife_name || "",
          age: memberObj.age || "",
          cell_no: memberObj.phone || "",
        }));

        if (memberObj.hof) {
          setIsHof(true);
        } else {
          setIsHof(false);
          setNextHof("");
        }
      }
    }
  }, [selectedMember, members]);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFamily || !selectedHof || !selectedMember) {
      alert("⚠️ Please complete family, HOF, and member selection.");
      return;
    }
    if (isHof && !nextHof) {
      alert("⚠️ Please select the next HOF.");
      return;
    }

    const payload = {
      // ✅ Changed 'deceasedId' to 'memberId' to match backend
      memberId: selectedMember,
      nextHofId: isHof ? nextHof : null, // ✅ Added nextHofId for manual HOF selection
      
      // Death record data
      sl_no: parseInt(formData.sl_no), // ✅ Convert to number
      family_no: selectedFamily.family_number,
      name: formData.name,
      house_name: formData.house_name,
      address_place: formData.address_place,
      father_husband_name: formData.father_husband_name,
      mother_wife_name: formData.mother_wife_name,
      death_date: formData.death_date,
      burial_date: formData.burial_date,
      age: formData.age ? parseInt(formData.age) : null, // ✅ Convert to number
      conducted_by: formData.conducted_by, // ✅ Changed from 'church'
      cause_of_death: formData.cause_of_death,
      cell_no: formData.cell_no,
      remarks: formData.remarks,
    };

    try {
      const res = await fetch("https://stmaryscathedral.onrender.com/api/deaths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json(); // ✅ Get response data for better error handling

      if (!res.ok) {
        throw new Error(data.error || "Failed to add death record");
      }

      alert("✅ Death record added successfully!");
      
      // Reset form
      setSearchQuery("");
      setFilteredFamilies([]);
      setSelectedFamily(null);
      setSelectedHof("");
      setMembers([]);
      setSelectedMember("");
      setIsHof(false);
      setNextHof("");
      setFormData({
        sl_no: "",
        name: "",
        house_name: "",
        address_place: "",
        father_husband_name: "",
        mother_wife_name: "",
        death_date: "",
        burial_date: "",
        age: "",
        conducted_by: "", // ✅ Changed from 'church'
        cause_of_death: "",
        cell_no: "",
        remarks: "",
      });
    } catch (err) {
      console.error(err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Add Death Record</h2>

        {/* Search Family */}
        <div className="input-group">
          <label>Search Family</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type family name..."
          />
          {filteredFamilies.length > 0 && (
            <ul className="suggestions">
              {filteredFamilies.map((fam) => (
                <li
                  key={fam._id}
                  onClick={() => {
                    setSelectedFamily(fam);
                    setSearchQuery(fam.name);
                    setFilteredFamilies([]);
                    const sameNameFamilies = families.filter((f) => f.name === fam.name);
                    if (sameNameFamilies.length === 1) {
                      setSelectedHof(fam.hof);
                    } else {
                      setSelectedHof("");
                    }
                  }}
                >
                  {fam.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* HOF dropdown if multiple families with same name */}
        {selectedFamily &&
          families.filter((f) => f.name === selectedFamily.name).length > 1 && (
            <div className="input-group">
              <label>Select HOF</label>
              <select
                value={selectedHof}
                onChange={(e) => setSelectedHof(e.target.value)}
                required
              >
                <option value="">Select HOF</option>
                {families
                  .filter((f) => f.name === selectedFamily.name)
                  .map((f) => (
                    <option key={f._id} value={f.hof}>
                      {f.hof}
                    </option>
                  ))}
              </select>
            </div>
          )}

        {/* Member dropdown */}
        {selectedHof && members.length > 0 && (
          <div className="input-group">
            <label>Select Member (Deceased)</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              required
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Next HOF if deceased was HOF */}
        {isHof && (
          <div className="input-group">
            <label>Select Next HOF</label>
            <select
              value={nextHof}
              onChange={(e) => setNextHof(e.target.value)}
              required
            >
              <option value="">Select Next HOF</option>
              {members
                .filter((m) => m._id !== selectedMember)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Rest of form inputs */}
        <div className="input-group">
          <input
            type="text"
            name="sl_no"
            value={formData.sl_no}
            onChange={handleChange}
            required
          />
          <label>Sl No</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="house_name"
            value={formData.house_name}
            onChange={handleChange}
          />
          <label>House Name</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="address_place"
            value={formData.address_place}
            onChange={handleChange}
          />
          <label>Address/Place</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="father_husband_name"
            value={formData.father_husband_name}
            onChange={handleChange}
          />
          <label>Father/Husband Name</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="mother_wife_name"
            value={formData.mother_wife_name}
            onChange={handleChange}
          />
          <label>Mother/Wife Name</label>
        </div>

        <div className="input-group">
          <input
            type="date"
            name="death_date"
            value={formData.death_date}
            onChange={handleChange}
            required
          />
          <label>Death Date</label>
        </div>

        <div className="input-group">
          <input
            type="date"
            name="burial_date"
            value={formData.burial_date}
            onChange={handleChange}
          />
          <label>Burial Date</label>
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

        <div className="input-group">
          <input
            type="text"
            name="conducted_by"
            value={formData.conducted_by}
            onChange={handleChange}
          />
          <label>Conducted by</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="cause_of_death"
            value={formData.cause_of_death}
            onChange={handleChange}
          />
          <label>Cause of Death</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="cell_no"
            value={formData.cell_no}
            onChange={handleChange}
          />
          <label>Cell No.</label>
        </div>

        <div className="input-group">
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
          ></textarea>
          <label>Remarks</label>
        </div>

        <button type="submit" className="submit-btn">
          Add Death Record
        </button>
      </form>
    </div>
  );
};

export default AddDeathRecord;