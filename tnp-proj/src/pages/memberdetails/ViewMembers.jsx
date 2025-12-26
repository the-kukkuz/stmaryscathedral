// src/pages/memberdetails/ViewMembers.jsx
import React, { useEffect, useState } from "react";
import "../../css/viewmembers.css";
import { getMembers } from "../../api"; // <-- named import from src/api.js
import { generateTablePdf } from "../../utils/pdfExport";

const ViewMembers = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    getMembers()
      .then((res) => {
        if (!mounted) return;
        setMembers(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching members:", err);
        setError("Could not load members");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredMembers = members.filter((m) =>
    (m.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="container-input2">
        <input
          type="text"
          placeholder="SEARCH MEMBER"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
        {/* keep your svg here */}
      </div>

      <div className="member-table-container1">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2>Members ({filteredMembers.length})</h2>
          <button
            type="button"
            onClick={() => {
              const columns = [
                { key: "slNo", header: "Sl No" },
                { key: "name", header: "Name" },
                { key: "gender", header: "Gender" },
                { key: "relation", header: "Relation" },
                { key: "dob", header: "DOB" },
                { key: "age", header: "Age" },
                { key: "occupation", header: "Occupation" },
                { key: "phone", header: "Phone" },
                { key: "email", header: "Email" },
                { key: "bloodGroup", header: "Blood Group" },
                { key: "aadhaar", header: "Aadhaar" },
                { key: "familyNumber", header: "Family No" },
                { key: "hof", header: "HoF" },
                { key: "baptism", header: "Baptism" },
              ];
              const rows = filteredMembers.map((member, index) => ({
                slNo: index + 1,
                name: member.name || `${member.firstName || ""} ${member.lastName || ""}`,
                gender: member.gender || "",
                relation: member.relation || "",
                dob: member.dob ? new Date(member.dob).toLocaleDateString() : "",
                age: member.age || "",
                occupation: member.occupation || "",
                phone: member.phone || "",
                email: member.email || "",
                bloodGroup: member.blog_group || "",
                aadhaar: member.aadhaar || member.aadhaar || "",
                familyNumber: member.family_number || member.familyNo || "",
                hof: member.hof || member.isHof ? "Yes" : "No",
                baptism: member.baptism ? "Yes" : "No",
              }));
              generateTablePdf({
                title: "Members List",
                columns,
                rows,
                fileName: "members.pdf",
              });
            }}
            className="submit-btn"
          >
            Download PDF
          </button>
        </div>

        {error && <div style={{ color: "red", padding: "8px" }}>{error}</div>}

        <div className="table-wrapper1">
          <table className="member-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Relation</th>
                <th>DOB</th>
                <th>Age</th>
                <th>Occupation</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Blood Group</th>
                <th>Aadhaar</th>
                <th>Family No</th>
                <th>HoF</th>
                <th>Baptism</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, idx) => (
                  <tr key={member._id || idx}>
                    <td>{idx + 1}</td>
                    <td>{member.name || `${member.firstName || ""} ${member.lastName || ""}`}</td>
                    <td>{member.gender || ""}</td>
                    <td>{member.relation || ""}</td>
                    <td>{member.dob ? new Date(member.dob).toLocaleDateString() : ""}</td>
                    <td>{member.age || ""}</td>
                    <td>{member.occupation || ""}</td>
                    <td>{member.phone || ""}</td>
                    <td>{member.email || ""}</td>
                    <td>{member.blog_group || ""}</td>
                    <td>{member.aadhaar || member.aadhaar || ""}</td>
                    <td>{member.family_number || member.familyNo || ""}</td>
                    <td>{member.hof || member.isHof ? "Yes" : "No"}</td>
                    <td>{member.baptism ? "Yes" : "No"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14">No members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ViewMembers;
