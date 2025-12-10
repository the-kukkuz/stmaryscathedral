import React, { useState, useEffect } from 'react';
import "../../css/addmarriage.css";

const AddMarriage = () => {
  const [groomSearch, setGroomSearch] = useState("");
  const [brideSearch, setBrideSearch] = useState("");
  const [allMembers, setAllMembers] = useState([]);
  const [filteredGrooms, setFilteredGrooms] = useState([]);
  const [filteredBrides, setFilteredBrides] = useState([]);
  const [selectedGroom, setSelectedGroom] = useState(null);
  const [selectedBride, setSelectedBride] = useState(null);
  
  const [marriageData, setMarriageData] = useState({
    marriage_id: "",
    date: "",
    place: "",
    officiant_number: ""
  });

  // Fetch all members on component mount
  useEffect(() => {
    fetch("https://stmaryscathedral.onrender.com/api/members")
      .then((res) => res.json())
      .then((data) => {
        // Filter out deceased members
        const activeMembers = data.filter(member => !member.deceased);
        setAllMembers(activeMembers);
      })
      .catch((err) => console.error("Error fetching members:", err));
  }, []);

  // Filter grooms (male members)
  useEffect(() => {
    if (groomSearch.trim() === "") {
      setFilteredGrooms([]);
    } else {
      const males = allMembers.filter(
        (m) => 
          m.gender?.toLowerCase() === "male" && 
          m.name.toLowerCase().includes(groomSearch.toLowerCase())
      );
      setFilteredGrooms(males.slice(0, 10)); // Limit to 10 results
    }
  }, [groomSearch, allMembers]);

  // Filter brides (female members)
  useEffect(() => {
    if (brideSearch.trim() === "") {
      setFilteredBrides([]);
    } else {
      const females = allMembers.filter(
        (m) => 
          m.gender?.toLowerCase() === "female" && 
          m.name.toLowerCase().includes(brideSearch.toLowerCase())
      );
      setFilteredBrides(females.slice(0, 10)); // Limit to 10 results
    }
  }, [brideSearch, allMembers]);

  // Handle marriage form input
  const handleMarriageDataChange = (e) => {
    setMarriageData({
      ...marriageData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGroom) {
      alert("⚠️ Please select a groom");
      return;
    }
    if (!selectedBride) {
      alert("⚠️ Please select a bride");
      return;
    }
    if (selectedGroom._id === selectedBride._id) {
      alert("⚠️ Groom and Bride cannot be the same person");
      return;
    }

    const payload = {
      marriage_id: marriageData.marriage_id,
      spouse1_id: selectedGroom._id,
      spouse1: selectedGroom.name,
      spouse2_id: selectedBride._id,
      spouse2: selectedBride.name,
      date: marriageData.date,
      place: marriageData.place,
      officiant_number: marriageData.officiant_number
    };

    try {
      const res = await fetch("https://stmaryscathedral.onrender.com/api/marriages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add marriage record");
      }

      alert("✅ Marriage record added successfully!");
      
      // Reset form
      setGroomSearch("");
      setBrideSearch("");
      setSelectedGroom(null);
      setSelectedBride(null);
      setFilteredGrooms([]);
      setFilteredBrides([]);
      setMarriageData({
        marriage_id: "",
        date: "",
        place: "",
        officiant_number: ""
      });
    } catch (err) {
      console.error(err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <>
      <div className="marriage-flex-container">
        {/* Groom Section */}
        <div className="marriage-card">
          <h2 className="marriage-title">Search Groom</h2>
          <div className="marriage-input-wrapper">
            <input
              type="text"
              placeholder="SEARCH GROOM"
              value={groomSearch}
              onChange={(e) => setGroomSearch(e.target.value)}
              className="marriage-input"
            />
            <svg fill="#000000" width="20px" height="20px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
              <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" fillRule="evenodd"></path>
            </svg>
          </div>
          
          {selectedGroom && (
            <div className="marriage-selected-info">
              <strong>Selected: {selectedGroom.name}</strong>
              <button 
                type="button"
                onClick={() => setSelectedGroom(null)}
                className="marriage-clear-btn"
              >
                Clear
              </button>
            </div>
          )}

          <div className="marriage-table-container">
            <table className="marriage-table">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Relation</th>
                  <th>DOB</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrooms.length > 0 ? (
                  filteredGrooms.map((member, index) => (
                    <tr key={member._id}>
                      <td>{index + 1}</td>
                      <td>{member.name}</td>
                      <td>{calculateAge(member.dob)}</td>
                      <td>{member.relation || "N/A"}</td>
                      <td>{formatDate(member.dob)}</td>
                      <td>{member.phone || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGroom(member);
                            setGroomSearch("");
                            setFilteredGrooms([]);
                          }}
                          className="marriage-select-btn"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="marriage-no-data">
                      {groomSearch ? "No male members found" : "Search for groom"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bride Section */}
        <div className="marriage-card">
          <h2 className="marriage-title">Search Bride</h2>
          <div className="marriage-input-wrapper">
            <input
              type="text"
              placeholder="SEARCH BRIDE"
              value={brideSearch}
              onChange={(e) => setBrideSearch(e.target.value)}
              className="marriage-input"
            />
            <svg fill="#000000" width="20px" height="20px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
              <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" fillRule="evenodd"></path>
            </svg>
          </div>

          {selectedBride && (
            <div className="marriage-selected-info">
              <strong>Selected: {selectedBride.name}</strong>
              <button 
                type="button"
                onClick={() => setSelectedBride(null)}
                className="marriage-clear-btn"
              >
                Clear
              </button>
            </div>
          )}

          <div className="marriage-table-container">
            <table className="marriage-table">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Relation</th>
                  <th>DOB</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrides.length > 0 ? (
                  filteredBrides.map((member, index) => (
                    <tr key={member._id}>
                      <td>{index + 1}</td>
                      <td>{member.name}</td>
                      <td>{calculateAge(member.dob)}</td>
                      <td>{member.relation || "N/A"}</td>
                      <td>{formatDate(member.dob)}</td>
                      <td>{member.phone || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBride(member);
                            setBrideSearch("");
                            setFilteredBrides([]);
                          }}
                          className="marriage-select-btn"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="marriage-no-data">
                      {brideSearch ? "No female members found" : "Search for bride"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Marriage Details Form */}
      <div className="marriage-form-container">
        <form onSubmit={handleSubmit} className="marriage-form">
          <h2 className="marriage-form-title">Marriage Details</h2>
          
          <div className="marriage-form-grid">
            <div className="marriage-input-group">
              <label>Marriage ID *</label>
              <input
                type="text"
                name="marriage_id"
                value={marriageData.marriage_id}
                onChange={handleMarriageDataChange}
                required
                placeholder="e.g., MAR-2024-001"
              />
            </div>

            <div className="marriage-input-group">
              <label>Marriage Date *</label>
              <input
                type="date"
                name="date"
                value={marriageData.date}
                onChange={handleMarriageDataChange}
                required
              />
            </div>

            <div className="marriage-input-group">
              <label>Place</label>
              <input
                type="text"
                name="place"
                value={marriageData.place}
                onChange={handleMarriageDataChange}
                placeholder="Church/Location"
              />
            </div>

            <div className="marriage-input-group">
              <label>Officiant Number</label>
              <input
                type="text"
                name="officiant_number"
                value={marriageData.officiant_number}
                onChange={handleMarriageDataChange}
                placeholder="Contact number"
              />
            </div>
          </div>

          <div className="marriage-summary">
            <h3>Selected Couple:</h3>
            <div className="marriage-couple-info">
              <div>
                <strong>Groom:</strong> {selectedGroom ? selectedGroom.name : "Not selected"}
              </div>
              <div>
                <strong>Bride:</strong> {selectedBride ? selectedBride.name : "Not selected"}
              </div>
            </div>
          </div>

          <button type="submit" className="marriage-submit-btn">
            Register Marriage
          </button>
        </form>
      </div>
    </>
  );
};

export default AddMarriage;