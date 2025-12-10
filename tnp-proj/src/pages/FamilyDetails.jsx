import React from 'react';
import "../css/familydetails.css";
import { useNavigate, useParams } from "react-router-dom";

const FamilyDetails = () => {
  const navigate = useNavigate();
  const { familyId } = useParams();

  return (
    <div className="card-container1">

      <h2>Family ID: {familyId || "None"}</h2>

      <div className="card" onClick={() => navigate("/AddFamily")}>
        <div className="card-details">
          <p className="text-title">ADD FAMILY</p>
        </div>
      </div>

      <div className="card" onClick={() => navigate("/SearchFamily")}>
        <div className="card-details">
          <p className="text-title">SEARCH FAMILY</p>
        </div>
      </div>

      {/* Example: navigate to a specific family */}
      <div className="card" onClick={() => navigate("/family/1")}>
        <div className="card-details">
          <p className="text-title">VIEW FAMILY 1</p>
        </div>
      </div>

    </div>
  );
};

export default FamilyDetails;
