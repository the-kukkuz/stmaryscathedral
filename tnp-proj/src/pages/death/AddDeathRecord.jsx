import React, { useState, useEffect } from "react";
import "../../css/deathadd.css";
import { generateDeathCertificatePdf } from "../../utils/pdfExport";
import { buildAddress, inferParentSpouseNames } from "../../utils/relationInference";
import { api } from "../../api";

const normalizeBlockValue = (value) => {
  if (value === undefined || value === null) return "";

  const str = String(value).trim();
  const blockMatch = str.match(/^Block\s*(\d+)$/i);
  if (blockMatch) return String(parseInt(blockMatch[1], 10));

  const numberMatch = str.match(/^(\d+)$/);
  if (numberMatch) return String(parseInt(numberMatch[1], 10));

  return str;
};

const normalizeUnitValue = (value) => {
  if (value === undefined || value === null || value === "") return "";

  const parsed = parseInt(String(value).trim(), 10);
  if (Number.isNaN(parsed)) return String(value).trim();

  return String(parsed);
};

const AddDeathRecord = () => {
  const [families, setFamilies] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isHof, setIsHof] = useState(false);
  const [nextHof, setNextHof] = useState("");
  const [isParishioner, setIsParishioner] = useState(true);
  const [savedRecord, setSavedRecord] = useState(null);


  const blockUnits = {
    1: [
      { number: 1, name: "Morth Smuni" },
      { number: 2, name: "Mar Athanasious" },
      { number: 3, name: "St. Philips" }
    ],
    2: [
      { number: 1, name: "Mar Basil" },
      { number: 2, name: "Mar Gabriel" },
      { number: 3, name: "St. Joseph" },
      { number: 4, name: "St. Andrews" },
      { number: 5, name: "Mar Gregorious" },
      { number: 6, name: "St. Thomas" }
    ],
    3: [
      { number: 1, name: "St. Paul" },
      { number: 2, name: "Mar Aprem" },
      { number: 3, name: "St. James" }
    ],
    4: [
      { number: 1, name: "St. Johns" },
      { number: 2, name: "Mar Micheal" },
      { number: 3, name: "Mar Bahanam" }
    ],
    5: [
      { number: 1, name: "St. George" },
      { number: 2, name: "Morth Uluthy" },
      { number: 3, name: "Mar Kauma" },
      { number: 4, name: "Mar Alias" },
      { number: 5, name: "Mar Ignatious" },
      { number: 6, name: "St. Peters" }
    ],
    6: [
      { number: 1, name: "Mar Severios" },
      { number: 2, name: "Mar Yacob Burdhana" },
      { number: 3, name: "Mar Semavoon" },
      { number: 4, name: "Mar Ahathulla" },
      { number: 5, name: "St. Mathews" },
      { number: 6, name: "Mar Julius" }
    ]
  };

  const [formData, setFormData] = useState({
    name: "",
    house_name: "",
    address_place: "",
    block: "",
    unit: "",
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
    let cancelled = false;

    const fetchAllFamilies = async () => {
      try {
        const limit = 200;
        let page = 1;
        let allFamilies = [];

        while (true) {
          const { data } = await api.get("/families", {
            params: { page, limit }
          });

          if (!Array.isArray(data) || data.length === 0) {
            break;
          }

          allFamilies = allFamilies.concat(data);

          if (data.length < limit) {
            break;
          }

          page += 1;
        }

        if (!cancelled) {
          setFamilies(allFamilies);
        }
      } catch (err) {
        console.error("Error fetching families:", err);
      }
    };

    fetchAllFamilies();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter families by selected block + unit
  useEffect(() => {
    const hasBlockAndUnit = Boolean(formData.block && formData.unit);

    if (!hasBlockAndUnit) {
      setFilteredFamilies([]);
      return;
    }

    const scopedFamilies = families.filter((fam) => {
      const blockMatch = normalizeBlockValue(fam.ward_number) === normalizeBlockValue(formData.block);
      const unitMatch = normalizeUnitValue(fam.family_unit) === normalizeUnitValue(formData.unit);
      return blockMatch && unitMatch;
    });

    const sortedFamilies = [...scopedFamilies].sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();

      const byName = aName.localeCompare(bName);
      if (byName !== 0) return byName;

      return String(a.family_number || "").localeCompare(String(b.family_number || ""));
    });

    setFilteredFamilies(sortedFamilies);
  }, [families, formData.block, formData.unit]);

  // Fetch members when family selected
  useEffect(() => {
    if (selectedFamily) {
      api.get(`/members?family_number=${selectedFamily.family_number}`)
        .then(({ data }) => setMembers(data))
        .catch((err) => console.error("Error fetching members:", err));
    } else {
      setMembers([]);
    }
  }, [selectedFamily]);


  // Autofill when member selected
  useEffect(() => {
    if (selectedMember && selectedFamily) {
      // Fetch family data to get location, village, and hof name
      api.get(`/families/number/${selectedFamily.family_number}`)
        .then(({ data: family }) => {
          const memberObj = members.find((m) => m._id === selectedMember);
          
          if (memberObj) {
            // Build address from family location + village
            const address = buildAddress(family);
            
            // Infer parent/spouse names from family structure
            const { fatherName, motherName, spouseName } = inferParentSpouseNames(
              memberObj,
              members,
              family.hof
            );
            
            setFormData((prev) => ({
              ...prev,
              name: memberObj.name || "",
              house_name: family.name || "",
              address_place: address,
              block: normalizeBlockValue(family.ward_number),
              unit: normalizeUnitValue(family.family_unit),
              father_husband_name: fatherName || spouseName || "",
              mother_wife_name: motherName || "",
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
        })
        .catch((err) => console.error("Error fetching family data:", err));
    }
  }, [selectedMember, selectedFamily, members]);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleParishionerToggle = (value) => {
    setIsParishioner(value);

    // 🔥 reset dependent state safely
    setSelectedFamily(null);
    setMembers([]);
    setSelectedMember("");
    setIsHof(false);
    setNextHof("");

    setFormData((prev) => ({
      ...prev,
      name: "",
      house_name: "",
      address_place: "",
      block: "",
      unit: "",
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isParishioner && (!selectedFamily || !selectedMember)) {
      alert("⚠️ Please complete family and member selection.");
      return;
    }

    if (isHof && !nextHof) {
      alert("⚠️ Please select the next HOF.");
      return;
    }
    if (!isParishioner && !formData.name.trim()) {
      alert("⚠️ Name is required for non-parishioner.");
      return;
    }


    const payload = {
      memberId: isParishioner ? selectedMember : null,
      nextHofId: isParishioner && isHof ? nextHof : null,
      family_no: isParishioner ? selectedFamily.family_number : null,

      name: formData.name,
      house_name: formData.house_name,
      address_place: formData.address_place,
      block: formData.block,
      unit: formData.unit,
      father_husband_name: formData.father_husband_name,
      mother_wife_name: formData.mother_wife_name,

      death_date: formData.death_date,
      burial_date: formData.burial_date,
      age: formData.age ? parseInt(formData.age) : null,

      conducted_by: formData.conducted_by,
      cause_of_death: formData.cause_of_death,
      cell_no: formData.cell_no,
      remarks: formData.remarks,

      isParishioner: Boolean(isParishioner),
    };

    try {
      const { data } = await api.post("/deaths", payload);

      alert("✅ Death record added successfully!");
      setSavedRecord(data.death);

      // Reset form
      setFilteredFamilies([]);
      setSelectedFamily(null);
      setMembers([]);
      setSelectedMember("");
      setIsHof(false);
      setNextHof("");
      setFormData({
        name: "",
        house_name: "",
        address_place: "",
        block: "",
        unit: "",
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

        {/* Success banner with download */}
        {savedRecord && (
          <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>✅ Death record saved successfully!</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="submit-btn" style={{ background: '#8b5e3c' }} onClick={() => generateDeathCertificatePdf(savedRecord)}>📄 Download Certificate</button>
              <button type="button" className="submit-btn" style={{ background: '#888' }} onClick={() => setSavedRecord(null)}>✕ Dismiss</button>
            </div>
          </div>
        )}

        {/* Parishioner Toggle */}
        <div className="toggle-row">
          <span className="toggle-label">
            {isParishioner ? "Parishioner" : "Non-Parishioner"}
          </span>

          <label className="switch">
            <input
              type="checkbox"
              checked={isParishioner}
              onChange={(e) => handleParishionerToggle(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {isParishioner && (
          <>
            <div className="input-group">
              <label>Block</label>
              <select
                name="block"
                value={formData.block}
                onChange={(e) => {
                  setFormData({ ...formData, block: e.target.value, unit: "" });
                  setFilteredFamilies([]);
                  setSelectedFamily(null);
                  setMembers([]);
                  setSelectedMember("");
                  setIsHof(false);
                  setNextHof("");
                }}
              >
                <option value="">Select Block</option>
                {Object.keys(blockUnits).map((blockKey) => (
                  <option key={blockKey} value={blockKey}>
                    Block {blockKey}
                  </option>
                ))}
              </select>
            </div>

            {formData.block && (
              <div className="input-group">
                <label>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedFamily(null);
                    setMembers([]);
                    setSelectedMember("");
                    setIsHof(false);
                    setNextHof("");
                  }}
                >
                  <option value="">Select Unit</option>
                  {(blockUnits[parseInt(formData.block)] || []).map((unit) => (
                    <option key={unit.number} value={String(unit.number)}>
                      Unit {unit.number} — {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* ================= PARISHIONER FLOW ================= */}
        {isParishioner && (
          <>
            <div className="input-group">
              <label>Select Family</label>
              <select
                value={selectedFamily?._id || ""}
                onChange={(e) => {
                  const fam = filteredFamilies.find((f) => f._id === e.target.value) || null;
                  setSelectedFamily(fam);
                  setSelectedMember("");
                  setIsHof(false);
                  setNextHof("");
                }}
                disabled={!formData.block || !formData.unit}
                required
              >
                <option value="">Select Family</option>
                {filteredFamilies.map((fam) => (
                  <option key={fam._id} value={fam._id}>
                    {fam.name} — HOF: {fam.hof} — No: {fam.family_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Member dropdown */}
            {selectedFamily && members.length > 0 && (
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

            {/* Next HOF */}
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
          </>
        )}

        {/* ================= NON-PARISHIONER FLOW ================= */}
        {!isParishioner && (
          <>
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label>Name *</label>
            </div>
          </>
        )}

        {/* ================= CERTIFICATE FIELDS (in certificate order) ================= */}

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
          <label>Address</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="father_husband_name"
            value={formData.father_husband_name}
            onChange={handleChange}
          />
          <label>Husband's / Father's Name</label>
        </div>

        <div className="input-group">
          <input
            type="date"
            name="death_date"
            value={formData.death_date}
            onChange={handleChange}
            required
          />
          <label>Date of Demise *</label>
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
            type="date"
            name="burial_date"
            value={formData.burial_date}
            onChange={handleChange}
          />
          <label>Date of Funeral</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            name="conducted_by"
            value={formData.conducted_by}
            onChange={handleChange}
          />
          <label>Funeral Conducted by</label>
        </div>

        {/* ================= ADDITIONAL INFO (not on certificate) ================= */}
        <h3 style={{ marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
          Additional Information
        </h3>

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
