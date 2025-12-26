import React, { useState, useEffect } from 'react';
import "../../css/viewmarriage.css";
import { generateTablePdf, generateMarriageCertificatePdf } from "../../utils/pdfExport";

const ViewMarriage = () => {
  const [marriages, setMarriages] = useState([]);
  const [filteredMarriages, setFilteredMarriages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMarriage, setSelectedMarriage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({
    totalMarriages: 0,
    marriagesThisYear: 0,
    marriagesByYear: []
  });

  // Fetch all marriages and stats
  useEffect(() => {
    fetchMarriages();
    fetchStats();
  }, []);

  const fetchMarriages = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://stmaryscathedral.onrender.com/api/marriages");
      const data = await res.json();
      setMarriages(data);
      setFilteredMarriages(data);
    } catch (err) {
      console.error("Error fetching marriages:", err);
      alert("❌ Error loading marriages");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("https://stmaryscathedral.onrender.com/api/marriages/stats/overview");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Filter marriages based on search and year
  useEffect(() => {
    let filtered = marriages;

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (m) =>
          m.spouse1.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.spouse2.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.marriage_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Year filter
    if (filterYear) {
      filtered = filtered.filter((m) => {
        const year = new Date(m.date).getFullYear();
        return year.toString() === filterYear;
      });
    }

    setFilteredMarriages(filtered);
  }, [searchQuery, filterYear, marriages]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get unique years from marriages
  const getYears = () => {
    const years = marriages.map((m) => new Date(m.date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  // View marriage details
  const handleView = (marriage) => {
    setSelectedMarriage(marriage);
    setShowModal(true);
    setEditMode(false);
  };

  // Edit marriage
  const handleEdit = (marriage) => {
    setSelectedMarriage(marriage);
    setEditData({
      marriage_id: marriage.marriage_id,
      date: marriage.date.split('T')[0],
      place: marriage.place || "",
      officiant_number: marriage.officiant_number || ""
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Update marriage
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://stmaryscathedral.onrender.com/api/marriages/${selectedMarriage._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData)
        }
      );

      if (!res.ok) throw new Error("Failed to update marriage");

      alert("✅ Marriage updated successfully!");
      setShowModal(false);
      setEditMode(false);
      fetchMarriages();
    } catch (err) {
      console.error(err);
      alert("❌ Error updating marriage");
    }
  };

  // Delete marriage
  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this marriage record?")) {
      return;
    }

    try {
      const res = await fetch(`https://stmaryscathedral.onrender.com/api/marriages/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete marriage");

      alert("✅ Marriage deleted successfully!");
      fetchMarriages();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting marriage");
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedMarriage(null);
    setEditData({});
  };

  return (
    <div className="view-marriage-container">
      {/* Header with Stats */}
      <div className="marriage-header">
        <h1>Marriage Records</h1>
        <div className="marriage-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalMarriages}</div>
            <div className="stat-label">Total Marriages</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.marriagesThisYear}</div>
            <div className="stat-label">This Year</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="marriage-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by name or marriage ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="filter-select"
          >
            <option value="">All Years</option>
            {getYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterYear("");
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => {
              const columns = [
                { key: 'marriageId', header: 'Marriage ID' },
                { key: 'groom', header: 'Groom' },
                { key: 'bride', header: 'Bride' },
                { key: 'date', header: 'Date' },
                { key: 'place', header: 'Place' },
              ];
              const rows = filteredMarriages.map((marriage) => ({
                marriageId: marriage.marriage_id,
                groom: marriage.spouse1,
                bride: marriage.spouse2,
                date: formatDate(marriage.date),
                place: marriage.place || 'N/A',
              }));
              generateTablePdf({
                title: 'Marriage Records',
                columns,
                rows,
                fileName: 'marriage_records.pdf',
              });
            }}
            className="clear-filters-btn"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Marriage Table */}
      {loading ? (
        <div className="loading">Loading marriages...</div>
      ) : (
        <div className="marriage-table-wrapper">
          <table className="view-marriage-table">
            <thead>
              <tr>
                <th>Marriage ID</th>
                <th>Groom</th>
                <th>Bride</th>
                <th>Date</th>
                <th>Place</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarriages.length > 0 ? (
                filteredMarriages.map((marriage) => (
                  <tr key={marriage._id}>
                    <td>{marriage.marriage_id}</td>
                    <td>{marriage.spouse1}</td>
                    <td>{marriage.spouse2}</td>
                    <td>{formatDate(marriage.date)}</td>
                    <td>{marriage.place || "N/A"}</td>
                    <td className="action-buttons">
                      <button
                        onClick={() => handleView(marriage)}
                        className="btn-view"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(marriage)}
                        className="btn-edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(marriage._id)}
                        className="btn-delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                      <button
                        type="button"
                        onClick={() => generateMarriageCertificatePdf(marriage)}
                        className="btn-view"
                        title="Download Certificate"
                      >
                        Certificate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    {searchQuery || filterYear
                      ? "No marriages found matching your criteria"
                      : "No marriage records available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for View/Edit */}
      {showModal && selectedMarriage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            {editMode ? (
              // Edit Form
              <form onSubmit={handleUpdate}>
                <h2>Edit Marriage Record</h2>
                
                <div className="modal-section">
                  <h3>Couple Information</h3>
                  <div className="info-row">
                    <strong>Groom:</strong> {selectedMarriage.spouse1}
                  </div>
                  <div className="info-row">
                    <strong>Bride:</strong> {selectedMarriage.spouse2}
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Marriage Details</h3>
                  <div className="form-group">
                    <label>Marriage ID</label>
                    <input
                      type="text"
                      value={editData.marriage_id}
                      onChange={(e) =>
                        setEditData({ ...editData, marriage_id: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editData.date}
                      onChange={(e) =>
                        setEditData({ ...editData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Place</label>
                    <input
                      type="text"
                      value={editData.place}
                      onChange={(e) =>
                        setEditData({ ...editData, place: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Officiant Number</label>
                    <input
                      type="text"
                      value={editData.officiant_number}
                      onChange={(e) =>
                        setEditData({ ...editData, officiant_number: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-save">
                    Save Changes
                  </button>
                  <button type="button" onClick={closeModal} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // View Details
              <div>
                <h2>Marriage Details</h2>
                
                <div className="modal-section">
                  <h3>Marriage Information</h3>
                  <div className="info-row">
                    <strong>Marriage ID:</strong> {selectedMarriage.marriage_id}
                  </div>
                  <div className="info-row">
                    <strong>Date:</strong> {formatDate(selectedMarriage.date)}
                  </div>
                  <div className="info-row">
                    <strong>Place:</strong> {selectedMarriage.place || "N/A"}
                  </div>
                  <div className="info-row">
                    <strong>Officiant Number:</strong>{" "}
                    {selectedMarriage.officiant_number || "N/A"}
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Couple Information</h3>
                  <div className="couple-details">
                    <div className="spouse-card">
                      <h4>Groom</h4>
                      <p><strong>Name:</strong> {selectedMarriage.spouse1}</p>
                      {selectedMarriage.spouse1_id?.phone && (
                        <p><strong>Phone:</strong> {selectedMarriage.spouse1_id.phone}</p>
                      )}
                      {selectedMarriage.spouse1_id?.family_number && (
                        <p><strong>Family:</strong> {selectedMarriage.spouse1_id.family_number}</p>
                      )}
                    </div>
                    <div className="spouse-card">
                      <h4>Bride</h4>
                      <p><strong>Name:</strong> {selectedMarriage.spouse2}</p>
                      {selectedMarriage.spouse2_id?.phone && (
                        <p><strong>Phone:</strong> {selectedMarriage.spouse2_id.phone}</p>
                      )}
                      {selectedMarriage.spouse2_id?.family_number && (
                        <p><strong>Family:</strong> {selectedMarriage.spouse2_id.family_number}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="info-row">
                    <strong>Record Created:</strong>{" "}
                    {formatDate(selectedMarriage.createdAt)}
                  </div>
                  <div className="info-row">
                    <strong>Last Updated:</strong>{" "}
                    {formatDate(selectedMarriage.updatedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMarriage;