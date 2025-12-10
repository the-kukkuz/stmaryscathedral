import React, { useEffect, useState } from "react";
import "../../css/viewbaptism.css";

const SearchBap = () => {
  const [baptisms, setBaptisms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBaptisms();
  }, []);

  const fetchBaptisms = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://stmaryscathedral.onrender.com/api/baptisms");
      const data = await res.json();
      console.log("Fetched baptisms:", data); // Debug
      setBaptisms(data);
    } catch (err) {
      console.error("Error fetching baptisms:", err);
      alert("Error loading baptism records");
    } finally {
      setLoading(false);
    }
  };

  // Filter by member name, baptism name, family name, family number, HOF
  const filteredBaptisms = baptisms.filter((b) => {
    if (!search.trim()) return true;
    
    const searchLower = search.toLowerCase();
    return (
      (b.member_name || "").toLowerCase().includes(searchLower) ||
      (b.bapt_name || "").toLowerCase().includes(searchLower) ||
      (b.family_name || "").toLowerCase().includes(searchLower) ||
      (b.family_number || "").toLowerCase().includes(searchLower) ||
      (b.hof || "").toLowerCase().includes(searchLower) ||
      (b.godparent_name || "").toLowerCase().includes(searchLower) ||
      (b.place_of_baptism || "").toLowerCase().includes(searchLower) ||
      (b.church_where_baptised || "").toLowerCase().includes(searchLower) ||
      (b.certificate_number || "").toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
    <div className="member-table-container1">
      <div className="container-input2">
        <input
          type="text"
          placeholder="🔍 Search by name, family, baptism name, certificate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        background: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
      }}>
        <h2>Baptism Records ({filteredBaptisms.length})</h2>
        <button 
          onClick={fetchBaptisms}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#666',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          fontSize: '18px'
        }}>
          Loading baptism records...
        </div>
      ) : (
        <div className="table-wrapper1">
          <table className="member-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Family Number</th>
                <th>Family Name</th>
                <th>Head of Family</th>
                <th>Member Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Age</th>
                <th>Baptism Name</th>
                <th>Date of Baptism</th>
                <th>Place of Baptism</th>
                <th>Church Where Baptised</th>
                <th>Godparent Name</th>
                <th>Godparent House</th>
                <th>Certificate No.</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredBaptisms.length > 0 ? (
                filteredBaptisms.map((bap) => (
                  <tr key={bap._id}>
                    <td>{bap.sl_no}</td>
                    <td>{bap.family_number}</td>
                    <td>{bap.family_name}</td>
                    <td>{bap.hof}</td>
                    <td>{bap.member_name}</td>
                    <td>{bap.gender}</td>
                    <td>{formatDate(bap.member_dob)}</td>
                    <td>{calculateAge(bap.member_dob)} years</td>
                    <td><strong>{bap.bapt_name}</strong></td>
                    <td>{formatDate(bap.date_of_baptism)}</td>
                    <td>{bap.place_of_baptism || "N/A"}</td>
                    <td>{bap.church_where_baptised || "N/A"}</td>
                    <td>{bap.godparent_name || "N/A"}</td>
                    <td>{bap.godparent_house_name || "N/A"}</td>
                    <td>{bap.certificate_number || "N/A"}</td>
                    <td>{bap.remarks || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '16px' }}>
                    {search ? (
                      <>
                        No baptism records found matching <strong>"{search}"</strong>
                        <br />
                        <button 
                          onClick={() => setSearch("")}
                          style={{
                            marginTop: '15px',
                            padding: '10px 20px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      "No baptism records found"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Search Results Info */}
      {search && filteredBaptisms.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px 25px',
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          borderRadius: '8px',
          color: '#155724',
          fontWeight: '500',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          ✅ Found {filteredBaptisms.length} record{filteredBaptisms.length !== 1 ? 's' : ''} matching "{search}"
        </div>
      )}
    </div>
  );
};

export default SearchBap;