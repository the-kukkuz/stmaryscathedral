import React, { useEffect, useState } from "react";
import "../../css/viewdeath.css";
import { FaDirections } from "react-icons/fa";

const ViewDeathRecords = () => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/deaths`);

      if (!res.ok) throw new Error("Failed to fetch death records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
      alert("❌ Error fetching records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter logic (search by name, house name, cause, etc.)
  const filteredRecords = records.filter((rec) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (rec.name || "").toLowerCase().includes(s) ||
      (rec.house_name || "").toLowerCase().includes(s) ||
      (rec.family_no || "").toLowerCase().includes(s) ||
      (rec.address_place || "").toLowerCase().includes(s) ||
      (rec.father_husband_name || "").toLowerCase().includes(s) ||
      (rec.mother_wife_name || "").toLowerCase().includes(s) ||
      (rec.cause_of_death || "").toLowerCase().includes(s) ||
      (rec.conducted_by || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="death-container">
      {/* 🔍 Search bar */}
      <div className="container-input2">
        <input
          type="text"
          placeholder="🔍 Search by name, family no, house, cause of death..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      {/* Header & Refresh */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection:"column",
          alignItems: "center",
          marginBottom: "20px",
          background: "white",
          padding: "20px 30px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2>Death Records ({filteredRecords.length})</h2>
        <button
          onClick={fetchRecords}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(238, 9, 121, 0.4)",
            transition: "all 0.3s ease",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#666",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            fontSize: "18px",
          }}
        >
          Loading death records...
        </div>
      ) : (
        <div className="table-wrapper1">
          <table className="death-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Family No</th>
                <th>Name</th>
                <th>House Name</th>
                <th>Address/Place</th>
                <th>Father/Husband Name</th>
                <th>Mother/Wife Name</th>
                <th>Death Date</th>
                <th>Burial Date</th>
                <th>Age</th>
                <th>Conducted by</th>
                <th>Cause of Death</th>
                <th>Cell No</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec._id}>
                    <td>{rec.sl_no}</td>
                    <td>{rec.family_no}</td>
                    <td>{rec.name}</td>
                    <td>{rec.house_name || "-"}</td>
                    <td>{rec.address_place || "-"}</td>
                    <td>{rec.father_husband_name || "-"}</td>
                    <td>{rec.mother_wife_name || "-"}</td>
                    <td>
                      {rec.death_date
                        ? new Date(rec.death_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {rec.burial_date
                        ? new Date(rec.burial_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{rec.age || "-"}</td>
                    <td>{rec.conducted_by || "-"}</td>
                    <td>{rec.cause_of_death || "-"}</td>
                    <td>{rec.cell_no || "-"}</td>
                    <td>{rec.remarks || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="14"
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#999",
                      fontSize: "16px",
                    }}
                  >
                    {search ? (
                      <>
                        No death records found matching{" "}
                        <strong>"{search}"</strong>
                        <br />
                        <button
                          onClick={() => setSearch("")}
                          style={{
                            marginTop: "15px",
                            padding: "10px 20px",
                            background: "#3498db",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      "No death records found"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Search Result Info */}
      {search && filteredRecords.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px 25px",
            background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
            borderRadius: "8px",
            color: "#155724",
            fontWeight: "500",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          ✅ Found {filteredRecords.length} record
          {filteredRecords.length !== 1 ? "s" : ""} matching "{search}"
        </div>
      )}
    </div>
  );
};

export default ViewDeathRecords;
