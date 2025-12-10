import React, { useState, useEffect } from 'react';
import '../../css/baptism.css';

const NewBaptism = () => {
  // Form states
  const [familySearch, setFamilySearch] = useState('');
  const [familyResults, setFamilyResults] = useState([]);
  const [selectedFamilyName, setSelectedFamilyName] = useState('');
  
  const [headsOfFamily, setHeadsOfFamily] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedFamily, setSelectedFamily] = useState(null);
  
  const [unbaptizedMembers, setUnbaptizedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Baptism form data
  const [formData, setFormData] = useState({
    date_of_baptism: '',
    place_of_baptism: '',
    church_where_baptised: '',
    bapt_name: '',
    godparent_name: '',
    godparent_house_name: '',
    certificate_number: '',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search families as user types
  useEffect(() => {
    if (familySearch.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchFamilies();
      }, 300);
      return () => clearTimeout(delaySearch);
    } else {
      setFamilyResults([]);
    }
  }, [familySearch]);

  // Fetch heads of family when family name is selected
  useEffect(() => {
    if (selectedFamilyName) {
      fetchHeadsOfFamily();
    }
  }, [selectedFamilyName]);

  // Fetch unbaptized members when family is selected
  useEffect(() => {
    if (selectedFamilyId) {
      const family = headsOfFamily.find(f => f._id === selectedFamilyId);
      setSelectedFamily(family);
      if (family) {
        fetchUnbaptizedMembers(family.family_number);
      }
    }
  }, [selectedFamilyId]);

  // Auto-fill member details when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      const member = unbaptizedMembers.find(m => m._id === selectedMemberId);
      setSelectedMember(member);
      
      if (member) {
        // Auto-fill form data
        setFormData(prev => ({
          ...prev,
          bapt_name: member.name,
          place_of_baptism: selectedFamily?.location || '',
          church_where_baptised: selectedFamily?.location || ''
        }));
      }
    }
  }, [selectedMemberId]);

  const searchFamilies = async () => {
    try {
      setSearchLoading(true);
      console.log("Searching for:", familySearch); // Debug
      const res = await fetch(`https://stmaryscathedral.onrender.com/api/baptisms/search-families/${familySearch}`);
      
      if (!res.ok) {
        console.error("Search failed:", res.status);
        return;
      }
      
      const data = await res.json();
      console.log("Search results:", data); // Debug
      
      // Get unique family names
      const uniqueFamilies = [...new Set(data.map(f => f.name))];
      console.log("Unique families:", uniqueFamilies); // Debug
      setFamilyResults(uniqueFamilies);
    } catch (err) {
      console.error('Error searching families:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchHeadsOfFamily = async () => {
    try {
      const res = await fetch(`https://stmaryscathedral.onrender.com/api/baptisms/heads-of-family/${selectedFamilyName}`);
      const data = await res.json();
      setHeadsOfFamily(data);
      
      // Reset subsequent selections
      setSelectedFamilyId('');
      setSelectedFamily(null);
      setUnbaptizedMembers([]);
      setSelectedMemberId('');
      setSelectedMember(null);
    } catch (err) {
      console.error('Error fetching heads of family:', err);
    }
  };

  const fetchUnbaptizedMembers = async (familyNumber) => {
    try {
      console.log("Fetching unbaptized members for family:", familyNumber);
      const res = await fetch(`https://stmaryscathedral.onrender.com/api/baptisms/unbaptized-members/${familyNumber}`);
      
      if (!res.ok) {
        console.error("Failed to fetch members:", res.status);
        return;
      }
      
      const data = await res.json();
      console.log("Unbaptized members response:", data);
      console.log("Number of unbaptized members:", data.length);
      
      setUnbaptizedMembers(data);
      
      // Reset member selection
      setSelectedMemberId('');
      setSelectedMember(null);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const handleFamilyNameSelect = (familyName) => {
    setSelectedFamilyName(familyName);
    setFamilySearch(familyName);
    setFamilyResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) {
      alert('Please select a member to baptize');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        member_id: selectedMember._id,
        ...formData
      };

      const res = await fetch('https://stmaryscathedral.onrender.com/api/baptisms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add baptism record');
      }

      alert('✅ Baptism record added successfully!');
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error(err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFamilySearch('');
    setFamilyResults([]);
    setSelectedFamilyName('');
    setHeadsOfFamily([]);
    setSelectedFamilyId('');
    setSelectedFamily(null);
    setUnbaptizedMembers([]);
    setSelectedMemberId('');
    setSelectedMember(null);
    setFormData({
      date_of_baptism: '',
      place_of_baptism: '',
      church_where_baptised: '',
      bapt_name: '',
      godparent_name: '',
      godparent_house_name: '',
      certificate_number: '',
      remarks: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="baptism-container">
      <h1 className="baptism-title">Add New Baptism Record</h1>

      <div className="baptism-form-card">
        <form onSubmit={handleSubmit}>
          
          {/* Step 1: Search and Select Family Name */}
          <div className="form-section">
            <h2 className="section-title">1. Select Family Name</h2>
            <div className="search-box">
              <label>Search Family Name *</label>
              <input
                type="text"
                placeholder="Type family name to search..."
                value={familySearch}
                onChange={(e) => setFamilySearch(e.target.value)}
                className="form-input"
                required
              />
              {searchLoading && (
                <div className="search-loading">Searching...</div>
              )}
              {!searchLoading && familyResults.length > 0 && (
                <ul className="search-results">
                  {familyResults.map((familyName, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleFamilyNameSelect(familyName)}
                      className="search-result-item"
                    >
                      {familyName}
                    </li>
                  ))}
                </ul>
              )}
              {!searchLoading && familySearch.length >= 2 && familyResults.length === 0 && (
                <div className="no-results-message">
                  No families found with name "{familySearch}"
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Head of Family */}
          {selectedFamilyName && headsOfFamily.length > 0 && (
            <div className="form-section">
              <h2 className="section-title">2. Select Head of Family</h2>
              <div className="form-group">
                <label>Head of Family (HOF) *</label>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Select HOF --</option>
                  {headsOfFamily.map((family) => (
                    <option key={family._id} value={family._id}>
                      {family.hof} - {family.family_number} {family.location ? `(${family.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFamily && (
                <div className="info-box">
                  <h3>Selected Family Details</h3>
                  <div className="info-grid">
                    <div><strong>Family Name:</strong> {selectedFamily.name}</div>
                    <div><strong>Family Number:</strong> {selectedFamily.family_number}</div>
                    <div><strong>HOF:</strong> {selectedFamily.hof}</div>
                    <div><strong>Location:</strong> {selectedFamily.location || 'N/A'}</div>
                    <div><strong>Contact:</strong> {selectedFamily.contact_number || 'N/A'}</div>
                    <div><strong>Ward:</strong> {selectedFamily.ward_number || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Member */}
          {selectedFamily && unbaptizedMembers.length > 0 && (
            <div className="form-section">
              <h2 className="section-title">3. Select Member to Baptize</h2>
              <div className="form-group">
                <label>Member Name *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Select Member --</option>
                  {unbaptizedMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.gender} - {formatDate(member.dob)} ({calculateAge(member.dob)} years)
                      {member.relation ? ` - ${member.relation}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMember && (
                <div className="info-box">
                  <h3>Selected Member Details</h3>
                  <div className="info-grid">
                    <div><strong>Name:</strong> {selectedMember.name}</div>
                    <div><strong>Gender:</strong> {selectedMember.gender}</div>
                    <div><strong>Date of Birth:</strong> {formatDate(selectedMember.dob)}</div>
                    <div><strong>Age:</strong> {calculateAge(selectedMember.dob)} years</div>
                    <div><strong>Relation:</strong> {selectedMember.relation || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedMember.phone || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show message if no unbaptized members */}
          {selectedFamily && unbaptizedMembers.length === 0 && (
            <div className="form-section">
              <div className="no-members-message">
                ⚠️ No unbaptized members found in this family. All members are either already baptized or marked as deceased.
              </div>
            </div>
          )}

          {/* Step 4: Baptism Details */}
          {selectedMember && (
            <div className="form-section">
              <h2 className="section-title">4. Enter Baptism Details</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Baptism Name *</label>
                  <input
                    type="text"
                    name="bapt_name"
                    value={formData.bapt_name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter baptism name"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Baptism *</label>
                  <input
                    type="date"
                    name="date_of_baptism"
                    value={formData.date_of_baptism}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Place of Baptism</label>
                  <input
                    type="text"
                    name="place_of_baptism"
                    value={formData.place_of_baptism}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter place"
                  />
                </div>

                <div className="form-group">
                  <label>Church Where Baptised</label>
                  <input
                    type="text"
                    name="church_where_baptised"
                    value={formData.church_where_baptised}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter church name"
                  />
                </div>

                <div className="form-group">
                  <label>Godparent Name</label>
                  <input
                    type="text"
                    name="godparent_name"
                    value={formData.godparent_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter godparent name"
                  />
                </div>

                <div className="form-group">
                  <label>Godparent House Name</label>
                  <input
                    type="text"
                    name="godparent_house_name"
                    value={formData.godparent_house_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter house name"
                  />
                </div>

                <div className="form-group">
                  <label>Certificate Number</label>
                  <input
                    type="text"
                    name="certificate_number"
                    value={formData.certificate_number}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter certificate number"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="form-input"
                    placeholder="Any additional remarks..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="reset-btn">
                  🔄 Reset Form
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? '⏳ Saving...' : '✅ Save Baptism Record'}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!selectedFamilyName && (
            <div className="instructions">
              <h3>📋 Instructions</h3>
              <ol>
                <li>Start by typing and selecting the family name</li>
                <li>Choose the Head of Family from the dropdown</li>
                <li>Select the member to be baptized from the dropdown</li>
                <li>Fill in the baptism details and submit</li>
              </ol>
              <p className="note">💡 Only unbaptized and living members will appear in the member dropdown</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewBaptism;