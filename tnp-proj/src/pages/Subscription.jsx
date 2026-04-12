import React, { useState, useEffect, useCallback } from 'react';
import "../css/subscription.css";
import { api } from "../api";

const Subscription = () => {
  // ─── Family search state ───
  const [families, setFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);

  // ─── Subscription data state ───
  const [subscriptionRecords, setSubscriptionRecords] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── Change subscription amount state ───
  const [showChangeRate, setShowChangeRate] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [changingRate, setChangingRate] = useState(false);

  // ─── Inline pay form state (for unpaid rows — "Pay Now") ───
  const [payingYear, setPayingYear] = useState(null);
  const [inlinePayForm, setInlinePayForm] = useState({
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    receipt_number: "",
    notes: ""
  });

  // ─── Edit form state (for existing real records — "Edit") ───
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    paid: true,
    amount: "",
    paid_date: "",
    payment_method: "Cash",
    receipt_number: "",
    notes: ""
  });
  const [editSaving, setEditSaving] = useState(false);

  // ─── Add Payment state (two-mode: single / multi) ───
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addPaymentMode, setAddPaymentMode] = useState("single"); // 'single' | 'multi'

  // Single-year form
  const [singleForm, setSingleForm] = useState({
    year: new Date().getFullYear(),
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    receipt_number: "",
    notes: ""
  });

  // Multi-year form
  const [multiSelectedYears, setMultiSelectedYears] = useState([]);
  const [multiForm, setMultiForm] = useState({
    amount_per_year: "",
    extra_amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    receipt_number: "",
    notes: ""
  });
  const [multiPaying, setMultiPaying] = useState(false);

  // ═══════════════════════════════════════════
  //  DATA FETCHING
  // ═══════════════════════════════════════════

  // Fetch all families on mount
  useEffect(() => {
<<<<<<< HEAD
    api.get("/families")
      .then(({ data }) => setFamilies(data))
=======
    fetch("/api/families")
      .then((res) => res.json())
      .then((data) => setFamilies(data))
>>>>>>> 5e2b8a1 (railway config)
      .catch((err) => console.error("Error fetching families:", err));
  }, []);

  // Filter families by search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFamilies([]);
    } else {
      setFilteredFamilies(
        families.filter((fam) =>
          fam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fam.family_number.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, families]);

  // Fetch subscription records when family is selected
  const fetchSubscriptionData = useCallback(async (familyNumber) => {
    try {
      setLoading(true);
<<<<<<< HEAD
      const { data } = await api.get(`/subscriptions/family/${familyNumber}`);

        setSubscriptionRecords(data.records || []);
        setFamilyData(data.family || null);

        const rate = data.family?.subscription_amount || "";

        // Pre-fill single form amount
        setSingleForm(prev => ({
          ...prev,
          amount: rate.toString(),
          year: new Date().getFullYear()
        }));

        // Pre-fill multi form
        setMultiForm(prev => ({
          ...prev,
          amount_per_year: rate.toString(),
          extra_amount: ""
        }));

        // Pre-select all unpaid years for multi
        const unpaidYears = (data.records || [])
          .filter(r => !r.paid)
          .map(r => r.year);
        setMultiSelectedYears(unpaidYears);
=======
      const res = await fetch(
        `/api/subscriptions/family/${familyNumber}`
      );
      const data = await res.json();
      setSubscriptionHistory(data);
      calculateDues(data);
>>>>>>> 5e2b8a1 (railway config)
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setSubscriptionRecords([]);
      setFamilyData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      fetchSubscriptionData(selectedFamily.family_number);
    }
  }, [selectedFamily, fetchSubscriptionData]);

  // ═══════════════════════════════════════════
  //  HANDLERS
  // ═══════════════════════════════════════════

  // Select a family from the search dropdown
  const handleFamilySelect = (family) => {
    setSelectedFamily(family);
    setSearchQuery(family.name);
    setFilteredFamilies([]);
    setShowChangeRate(false);
    setPayingYear(null);
    setEditingRecord(null);
    setShowAddPayment(false);
  };

  // ─── Change Subscription Amount ───
  const handleChangeRate = async () => {
    const amount = Number(newRate);
    if (!amount || amount < 0) {
      alert("⚠️ Please enter a valid amount");
      return;
    }

    if (!window.confirm(
      `⚠️ This will change the per-year subscription rate to ₹${amount} for all unpaid years.\n\nContinue?`
    )) {
      return;
    }

    try {
<<<<<<< HEAD
      setChangingRate(true);
      const { data } = await api.put(
        `/families/${selectedFamily._id}/subscription-amount`,
        { subscription_amount: amount }
      );
=======
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
>>>>>>> 5e2b8a1 (railway config)

      alert(`✅ Subscription rate updated to ₹${amount}\n${data.unpaid_records_updated || 0} unpaid record(s) updated.`);

      setSelectedFamily(prev => ({ ...prev, subscription_amount: amount }));
      setShowChangeRate(false);
      setNewRate("");
      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setChangingRate(false);
    }
  };

  // ─── Open Edit form for a real record ───
  const handleOpenEdit = (record) => {
    setPayingYear(null);
    setShowAddPayment(false);
    setEditingRecord(record);
    setEditForm({
      paid: record.paid,
      amount: record.amount.toString(),
      paid_date: record.paid_date
        ? new Date(record.paid_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      payment_method: record.payment_method || "Cash",
      receipt_number: record.receipt_number || "",
      notes: record.notes || ""
    });
  };

  // ─── Save Edit ───
  const handleEditSave = async () => {
    const amount = Number(editForm.amount);
    if (!amount || amount <= 0) {
      alert("⚠️ Please enter a valid amount");
      return;
    }

    try {
      setEditSaving(true);
      const payload = {
        paid: editForm.paid,
        amount,
        paid_date: editForm.paid ? editForm.paid_date : null,
        payment_method: editForm.payment_method,
        receipt_number: editForm.receipt_number,
        notes: editForm.notes
      };

      await api.put(`/subscriptions/${editingRecord._id}`, payload);

      setEditingRecord(null);
      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Delete Record ───
  const handleDeleteRecord = async (record) => {
    if (!window.confirm(
      `Are you sure you want to delete the subscription for ${record.year}? This cannot be undone.`
    )) {
      return;
    }

    try {
      const { data } = await api.delete(`/subscriptions/${record._id}`);

      if (data.subscription_amount_cleared) {
        alert(`✅ Subscription for ${record.year} deleted.\n\nℹ️ No subscriptions remain. Subscription rate has been cleared.`);
      }

      // Close edit form if this record was being edited
      if (editingRecord?._id === record._id) {
        setEditingRecord(null);
      }

      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ─── Inline Pay Now (single unpaid year from table) ───
  const handleOpenInlinePay = (year, amount) => {
    setEditingRecord(null);
    setShowAddPayment(false);
    setPayingYear(year);
    setInlinePayForm({
      amount: amount.toString(),
      paid_date: new Date().toISOString().split("T")[0],
      payment_method: "Cash",
      receipt_number: "",
      notes: ""
    });
  };

  const handleInlinePaySubmit = async (year) => {
    const amount = Number(inlinePayForm.amount);
    if (!amount || amount <= 0) {
      alert("⚠️ Please enter a valid amount");
      return;
    }

    const currentRate = familyData?.subscription_amount;
    if (currentRate && amount < currentRate) {
      alert(`⚠️ Amount (₹${amount}) cannot be less than the current subscription rate (₹${currentRate}).\nUse "Change Subscription Amount" to decrease the rate first.`);
      return;
    }

    try {
      const payload = {
        family_number: selectedFamily.family_number,
        family_name: selectedFamily.name,
        hof: selectedFamily.hof,
        year,
        amount,
        paid: true,
        paid_date: inlinePayForm.paid_date || new Date().toISOString(),
        payment_method: inlinePayForm.payment_method,
        receipt_number: inlinePayForm.receipt_number,
        notes: inlinePayForm.notes
      };

<<<<<<< HEAD
      await api.post("/subscriptions", payload);
=======
      const res = await fetch(`/api/subscriptions/${subscription._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
>>>>>>> 5e2b8a1 (railway config)

      setPayingYear(null);
      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ─── Single-Year Add Payment ───
  const handleSinglePaySubmit = async (e) => {
    e.preventDefault();

    const amount = Number(singleForm.amount);
    if (!amount || amount <= 0) {
      alert("⚠️ Please enter a valid amount");
      return;
    }

    const currentRate = familyData?.subscription_amount;
    if (currentRate && amount < currentRate) {
      alert(`⚠️ Amount (₹${amount}) cannot be less than the current subscription rate (₹${currentRate}).\nUse "Change Subscription Amount" to decrease the rate first.`);
      return;
    }

    try {
      const payload = {
        family_number: selectedFamily.family_number,
        family_name: selectedFamily.name,
        hof: selectedFamily.hof,
        year: Number(singleForm.year),
        amount,
        paid: true,
        paid_date: singleForm.paid_date || new Date().toISOString(),
        payment_method: singleForm.payment_method,
        receipt_number: singleForm.receipt_number,
        notes: singleForm.notes
      };

      await api.post("/subscriptions", payload);

      setShowAddPayment(false);
      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ─── Multi-Year Payment ───
  const handleMultiYearToggle = (year) => {
    setMultiSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleMultiSelectAll = () => {
    const allUnpaid = subscriptionRecords.filter(r => !r.paid).map(r => r.year);
    setMultiSelectedYears(allUnpaid);
  };

  const handleMultiDeselectAll = () => {
    setMultiSelectedYears([]);
  };

  const handleMultiPaySubmit = async (e) => {
    e.preventDefault();

    if (multiSelectedYears.length === 0) {
      alert("⚠️ Please select at least one year");
      return;
    }

    const amount = Number(multiForm.amount_per_year);
    if (!amount || amount <= 0) {
      alert("⚠️ Please enter a valid amount per year");
      return;
    }

    const extra = Number(multiForm.extra_amount) || 0;
    const subtotal = multiSelectedYears.length * amount;
    const grandTotal = subtotal + extra;
    const sortedSelectedYears = [...multiSelectedYears].sort((a, b) => a - b);
    const lastSelectedYear = sortedSelectedYears[sortedSelectedYears.length - 1];
    const yearsList = sortedSelectedYears.join(", ");

    let confirmMsg = `💰 Confirm Multi-Year Payment\n\nYears: ${yearsList}\nAmount per year: ₹${amount}\nBase: ${multiSelectedYears.length} × ₹${amount} = ₹${subtotal}`;
    if (extra > 0) {
      confirmMsg += `\nExtra: +₹${extra} on year ${lastSelectedYear}`;
    }
    confirmMsg += `\nGrand Total: ₹${grandTotal}\n\nProceed?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setMultiPaying(true);
      const { data } = await api.post("/subscriptions/bulk-pay", {
        family_number: selectedFamily.family_number,
        years: multiSelectedYears,
        amount_per_year: amount,
        extra_amount: extra,
        paid_date: multiForm.paid_date || new Date().toISOString(),
        payment_method: multiForm.payment_method,
        receipt_number: multiForm.receipt_number,
        notes: multiForm.notes
      });

      const createdCount = data.created?.length || 0;
      const failedCount = data.failed?.length || 0;
      const createdSorted = [...(data.created || [])].sort((a, b) => a.year - b.year);
      const appliedYear = data.extra_applied_to_year;
      const updatedRate = Math.max(Number(familyData?.subscription_amount) || 0, amount + extra);

      let msg = `✅ ${createdCount} years paid.`;

      if (createdSorted.length > 0) {
        const lines = createdSorted.map((r) => `${r.year}: ₹${r.amount}`);
        msg += `\n${lines.join("\n")}`;

        if (appliedYear !== undefined && appliedYear !== null) {
          const lastYearRecord = createdSorted.find((r) => r.year === appliedYear);
          if (lastYearRecord && extra > 0) {
            msg += `\n${appliedYear}: ₹${lastYearRecord.amount} (includes ₹${extra} extra)`;
          }
        }
      }

      msg += `\nSubscription rate updated to ₹${updatedRate}.`;

      if (failedCount > 0) {
        msg += `\n\n⚠️ ${failedCount} year(s) failed: ${data.failed.map(f => `${f.year} (${f.reason})`).join(", ")}`;
      }
      alert(msg);

      setShowAddPayment(false);
      setMultiSelectedYears([]);
      fetchSubscriptionData(selectedFamily.family_number);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setMultiPaying(false);
    }
  };

  // ═══════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Derived data
  const unpaidRecords = subscriptionRecords.filter(r => !r.paid);
  const paidRecords = subscriptionRecords.filter(r => r.paid);
  const totalPaid = paidRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalUnpaid = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);

  // Multi-year live calculation
  const multiSubtotal = multiSelectedYears.length * (Number(multiForm.amount_per_year) || 0);
  const multiExtra = Number(multiForm.extra_amount) || 0;
  const multiGrandTotal = multiSubtotal + multiExtra;
  const multiLastSelectedYear = multiSelectedYears.length
    ? [...multiSelectedYears].sort((a, b) => a - b)[multiSelectedYears.length - 1]
    : null;

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="subscription-container">
      <h1 className="subscription-main-title">Annual Church Subscription</h1>

      {/* ════════ SEARCH FAMILY ════════ */}
      <div className="subscription-search-section">
        <div className="subscription-search-wrapper">
          <input
            type="text"
            placeholder="Search family by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="subscription-search-input"
            id="subscription-family-search"
          />
          <svg fill="#000000" width="20px" height="20px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
            <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" fillRule="evenodd"></path>
          </svg>
        </div>

        {filteredFamilies.length > 0 && (
          <ul className="subscription-suggestions">
            {filteredFamilies.map((fam) => (
              <li
                key={fam._id}
                onClick={() => handleFamilySelect(fam)}
                className="subscription-suggestion-item"
              >
                <strong>{fam.name}</strong>
                <span>({fam.family_number})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ════════ SECTION 1: FAMILY INFO BAR ════════ */}
      {selectedFamily && (
        <div className="subscription-family-info">
          <h2>Family Details</h2>
          <div className="family-info-grid">
            <div className="info-item">
              <strong>Family Number:</strong>
              <span>{selectedFamily.family_number}</span>
            </div>
            <div className="info-item">
              <strong>Family Name:</strong>
              <span>{selectedFamily.name}</span>
            </div>
            <div className="info-item">
              <strong>Head of Family:</strong>
              <span>{selectedFamily.hof}</span>
            </div>
            <div className="info-item">
              <strong>Subscription Rate:</strong>
              <span className="subscription-rate-badge">
                {familyData?.subscription_amount
                  ? formatCurrency(familyData.subscription_amount)
                  : "Not set"}
                /year
              </span>
            </div>
            {totalUnpaid > 0 && (
              <div className="info-item dues-highlight">
                <strong>Outstanding Dues:</strong>
                <span>{formatCurrency(totalUnpaid)}</span>
              </div>
            )}
          </div>

          {/* Change Subscription Amount control */}
          <div className="change-rate-section">
            {!showChangeRate ? (
              <button
                className="change-rate-toggle-btn"
                onClick={() => {
                  setShowChangeRate(true);
                  setNewRate(familyData?.subscription_amount?.toString() || "");
                }}
                id="btn-change-rate"
              >
                ✏️ Change Subscription Amount
              </button>
            ) : (
              <div className="change-rate-form">
                <p className="change-rate-warning">
                  ⚠️ This will change the per-year rate for all unpaid years.
                </p>
                <div className="change-rate-inputs">
                  <div className="change-rate-input-group">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="New amount"
                      min="0"
                      step="1"
                      className="change-rate-input"
                      id="input-new-rate"
                    />
                  </div>
                  <button
                    className="change-rate-save-btn"
                    onClick={handleChangeRate}
                    disabled={changingRate}
                  >
                    {changingRate ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="change-rate-cancel-btn"
                    onClick={() => { setShowChangeRate(false); setNewRate(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ SECTION 2: SUBSCRIPTION TABLE ════════ */}
      {selectedFamily && (
        <div className="subscription-history-section">
          <div className="section-header-row">
            <h2>Subscription History</h2>
            <button
              className="add-payment-btn"
              onClick={() => {
                setShowAddPayment(v => !v);
                setPayingYear(null);
                setEditingRecord(null);
              }}
              id="btn-add-payment"
            >
              {showAddPayment ? "✕ Close" : "➕ Add Payment"}
            </button>
          </div>

          {/* ─── Add Payment Panel (Two-Mode) ─── */}
          {showAddPayment && (
            <div className="add-payment-panel">
              {/* Mode Tabs */}
              <div className="add-payment-mode-tabs">
                <button
                  className={`mode-tab ${addPaymentMode === 'single' ? 'active' : ''}`}
                  onClick={() => setAddPaymentMode('single')}
                  type="button"
                >
                  Single Year
                </button>
                <button
                  className={`mode-tab ${addPaymentMode === 'multi' ? 'active' : ''}`}
                  onClick={() => setAddPaymentMode('multi')}
                  type="button"
                >
                  Multiple Years
                </button>
              </div>

              {/* First-payment hint */}
              {!familyData?.subscription_amount && subscriptionRecords.length === 0 && (
                <p className="first-payment-hint">
                  💡 This is the first payment for this family. The amount entered will set the family&apos;s subscription rate.
                </p>
              )}

              {/* ─── MODE A: Single Year ─── */}
              {addPaymentMode === 'single' && (
                <form onSubmit={handleSinglePaySubmit} className="add-new-form">
                  <div className="add-new-fields">
                    <div className="inline-field">
                      <label>Year</label>
                      <input
                        type="number"
                        value={singleForm.year}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, year: e.target.value }))}
                        min="1900"
                        max="2200"
                        className="form-input"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Amount (₹)</label>
                      <input
                        type="number"
                        value={singleForm.amount}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, amount: e.target.value }))}
                        min={familyData?.subscription_amount || 1}
                        step="1"
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Date</label>
                      <input
                        type="date"
                        value={singleForm.paid_date}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, paid_date: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Method</label>
                      <select
                        value={singleForm.payment_method}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="form-input"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                    <div className="inline-field">
                      <label>Receipt No.</label>
                      <input
                        type="text"
                        value={singleForm.receipt_number}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                        placeholder="e.g. RCP/2026/0001"
                        className="form-input"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Notes</label>
                      <input
                        type="text"
                        value={singleForm.notes}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="add-new-actions">
                    <button type="submit" className="submit-btn inline-pay-submit">
                      ✓ Add Payment — {formatCurrency(Number(singleForm.amount) || 0)}
                    </button>
                    <button
                      type="button"
                      className="change-rate-cancel-btn"
                      onClick={() => setShowAddPayment(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* ─── MODE B: Multiple Years ─── */}
              {addPaymentMode === 'multi' && (
                <form onSubmit={handleMultiPaySubmit} className="multi-year-form">
                  {/* Year selection */}
                  <div className="bulk-year-selection">
                    <div className="bulk-selection-header">
                      <h3>Select Years to Pay</h3>
                      <div className="bulk-selection-actions">
                        <button type="button" className="bulk-select-btn" onClick={handleMultiSelectAll}>
                          Select All
                        </button>
                        <button type="button" className="bulk-select-btn" onClick={handleMultiDeselectAll}>
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="bulk-year-checkboxes">
                      {unpaidRecords.length > 0 ? (
                        [...unpaidRecords].sort((a, b) => a.year - b.year).map(record => (
                          <label
                            key={record.year}
                            className={`bulk-year-chip ${multiSelectedYears.includes(record.year) ? "selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={multiSelectedYears.includes(record.year)}
                              onChange={() => handleMultiYearToggle(record.year)}
                            />
                            <span className="chip-year">{record.year}</span>
                            {record.virtual && <span className="chip-virtual">virtual</span>}
                          </label>
                        ))
                      ) : (
                        <p className="no-unpaid-hint">No unpaid years to select. All years are paid!</p>
                      )}
                    </div>
                  </div>

                  {/* Payment fields */}
                  <div className="bulk-pay-form-fields">
                    <div className="bulk-field-row">
                      <div className="bulk-field">
                        <label>Amount Per Year (₹)</label>
                        <input
                          type="number"
                          value={multiForm.amount_per_year}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, amount_per_year: e.target.value }))}
                          min={familyData?.subscription_amount || 1}
                          step="1"
                          required
                          className="form-input subscription-amount-input"
                        />
                      </div>
                      <div className="bulk-field extra-amount-field">
                        <label>Extra Amount (₹) — added on top of the last selected year</label>
                        <input
                          type="number"
                          value={multiForm.extra_amount}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, extra_amount: e.target.value }))}
                          min="0"
                          step="1"
                          placeholder="0"
                          className="form-input"
                        />
                      </div>
                      <div className="bulk-field">
                        <label>Payment Date</label>
                        <input
                          type="date"
                          value={multiForm.paid_date}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, paid_date: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="bulk-field-row">
                      <div className="bulk-field">
                        <label>Payment Method</label>
                        <select
                          value={multiForm.payment_method}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="form-input"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Online">Online</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                      <div className="bulk-field">
                        <label>Receipt Number</label>
                        <input
                          type="text"
                          value={multiForm.receipt_number}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                          placeholder="e.g. RCP/2026/0001"
                          className="form-input"
                        />
                      </div>
                      <div className="bulk-field">
                        <label>Notes</label>
                        <input
                          type="text"
                          value={multiForm.notes}
                          onChange={(e) => setMultiForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Optional"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live total summary */}
                  {multiSelectedYears.length > 0 && (
                    <div className="bulk-total-summary">
                      <div className="summary-row">
                        <span className="summary-label">Selected Years:</span>
                        <span className="summary-value summary-years">
                          {[...multiSelectedYears].sort((a, b) => a - b).join(", ")}
                        </span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Base:</span>
                        <span className="summary-value">
                          {multiSelectedYears.length} {multiSelectedYears.length === 1 ? "year" : "years"} × ₹{multiForm.amount_per_year || 0} = {formatCurrency(multiSubtotal)}
                        </span>
                      </div>
                      <div className="summary-row summary-extra">
                        <span className="summary-label">Extra:</span>
                        <span className="summary-value">
                          + {formatCurrency(multiExtra)}
                          {multiLastSelectedYear ? ` on year ${multiLastSelectedYear}` : ""}
                        </span>
                      </div>
                      <div className="summary-row summary-grand-total">
                        <span className="summary-label">Grand Total:</span>
                        <span className="summary-value">{formatCurrency(multiGrandTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="add-new-actions">
                    <button
                      type="submit"
                      className="submit-btn pay-all-btn"
                      disabled={multiSelectedYears.length === 0 || multiPaying}
                    >
                      {multiPaying
                        ? "Processing..."
                        : `Pay ${multiSelectedYears.length} Year(s) — ${formatCurrency(multiGrandTotal)}`}
                    </button>
                    <button
                      type="button"
                      className="change-rate-cancel-btn"
                      onClick={() => setShowAddPayment(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ─── Table ─── */}
          {loading ? (
            <div className="loading">Loading history...</div>
          ) : subscriptionRecords.length > 0 ? (
            <div className="history-table-wrapper">
              <table className="subscription-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                    <th>Receipt No.</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionRecords.map((record) => (
                    <React.Fragment key={record._id || `virtual-${record.year}`}>
                      <tr
                        className={
                          record.virtual
                            ? "virtual-row"
                            : !record.paid
                              ? "unpaid-row"
                              : ""
                        }
                        title={record.virtual
                          ? "No record — auto-generated from subscription rate"
                          : ""
                        }
                      >
                        <td>
                          {record.year}
                          {record.virtual && (
                            <span className="virtual-indicator" title="No record — auto-generated from subscription rate">
                              ⓘ
                            </span>
                          )}
                        </td>
                        <td className="amount-cell">{formatCurrency(record.amount)}</td>
                        <td>
                          <span className={`status-badge ${record.paid ? 'status-paid' : 'status-unpaid'}`}>
                            {record.paid ? '✓ Paid' : '✗ Unpaid'}
                          </span>
                        </td>
                        <td>{record.paid ? formatDate(record.paid_date) : "—"}</td>
                        <td>{record.paid ? (record.receipt_number || "—") : "—"}</td>
                        <td className="actions-cell">
                          {/* Edit button — only for real (non-virtual) records */}
                          {!record.virtual && (
                            <button
                              onClick={() => {
                                if (editingRecord?._id === record._id) {
                                  setEditingRecord(null);
                                } else {
                                  handleOpenEdit(record);
                                }
                              }}
                              className={`edit-record-btn ${editingRecord?._id === record._id ? 'active' : ''}`}
                              title="Edit record"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {/* Delete button — only for real (non-virtual) records */}
                          {!record.virtual && (
                            <button
                              onClick={() => handleDeleteRecord(record)}
                              className="delete-record-btn"
                              title="Delete record"
                            >
                              🗑️
                            </button>
                          )}
                          {/* Pay Now — for unpaid rows (real or virtual) */}
                          {!record.paid && (
                            <button
                              onClick={() => {
                                if (payingYear === record.year) {
                                  setPayingYear(null);
                                } else {
                                  handleOpenInlinePay(record.year, record.amount);
                                }
                              }}
                              className={`paid-btn pay-now-btn ${payingYear === record.year ? 'active' : ''}`}
                              title="Pay Now"
                            >
                              💰 Pay Now
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* ─── Inline Edit Form ─── */}
                      {editingRecord && editingRecord._id === record._id && (
                        <tr className="inline-edit-row">
                          <td colSpan="6">
                            <div className="inline-edit-form">
                              <h4>Edit — {record.year}</h4>

                              {/* Paid/Unpaid toggle */}
                              <div className="edit-paid-toggle">
                                <span className="edit-paid-label">Status:</span>
                                <label className={`toggle-pill ${editForm.paid ? 'paid' : 'unpaid'}`}>
                                  <input
                                    type="checkbox"
                                    checked={editForm.paid}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      paid: e.target.checked
                                    }))}
                                  />
                                  <span className="toggle-pill-track">
                                    <span className="toggle-pill-thumb"></span>
                                  </span>
                                  <span className="toggle-pill-text">
                                    {editForm.paid ? '✓ Paid' : '✗ Unpaid'}
                                  </span>
                                </label>
                              </div>

                              <div className="inline-pay-fields">
                                <div className="inline-field">
                                  <label>Amount (₹)</label>
                                  <input
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                    min="1"
                                    step="1"
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Paid Date</label>
                                  <input
                                    type="date"
                                    value={editForm.paid_date}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, paid_date: e.target.value }))}
                                    disabled={!editForm.paid}
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Method</label>
                                  <select
                                    value={editForm.payment_method}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                    disabled={!editForm.paid}
                                    className="form-input"
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                  </select>
                                </div>
                                <div className="inline-field">
                                  <label>Receipt No.</label>
                                  <input
                                    type="text"
                                    value={editForm.receipt_number}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                                    placeholder="e.g. RCP/2026/0001"
                                    disabled={!editForm.paid}
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Notes</label>
                                  <input
                                    type="text"
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional"
                                    className="form-input"
                                  />
                                </div>
                              </div>

                              <div className="inline-pay-actions">
                                <button
                                  className="submit-btn inline-pay-submit"
                                  onClick={handleEditSave}
                                  disabled={editSaving}
                                >
                                  {editSaving ? "Saving..." : "✓ Save Changes"}
                                </button>
                                <button
                                  className="change-rate-cancel-btn"
                                  onClick={() => setEditingRecord(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* ─── Inline Pay Now form ─── */}
                      {payingYear === record.year && !record.paid && (
                        <tr className="inline-pay-row">
                          <td colSpan="6">
                            <div className="inline-pay-form">
                              <h4>Pay for {record.year}</h4>
                              <div className="inline-pay-fields">
                                <div className="inline-field">
                                  <label>Amount (₹)</label>
                                  <input
                                    type="number"
                                    value={inlinePayForm.amount}
                                    onChange={(e) => setInlinePayForm(prev => ({ ...prev, amount: e.target.value }))}
                                    min={familyData?.subscription_amount || 0}
                                    step="1"
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Date</label>
                                  <input
                                    type="date"
                                    value={inlinePayForm.paid_date}
                                    onChange={(e) => setInlinePayForm(prev => ({ ...prev, paid_date: e.target.value }))}
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Method</label>
                                  <select
                                    value={inlinePayForm.payment_method}
                                    onChange={(e) => setInlinePayForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                    className="form-input"
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                  </select>
                                </div>
                                <div className="inline-field">
                                  <label>Receipt No.</label>
                                  <input
                                    type="text"
                                    value={inlinePayForm.receipt_number}
                                    onChange={(e) => setInlinePayForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                                    placeholder="e.g. RCP/2026/0001"
                                    className="form-input"
                                  />
                                </div>
                                <div className="inline-field">
                                  <label>Notes</label>
                                  <input
                                    type="text"
                                    value={inlinePayForm.notes}
                                    onChange={(e) => setInlinePayForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional"
                                    className="form-input"
                                  />
                                </div>
                              </div>
                              <div className="inline-pay-actions">
                                <button
                                  className="submit-btn inline-pay-submit"
                                  onClick={() => handleInlinePaySubmit(record.year)}
                                >
                                  ✓ Confirm Payment — {formatCurrency(Number(inlinePayForm.amount) || 0)}
                                </button>
                                <button
                                  className="change-rate-cancel-btn"
                                  onClick={() => setPayingYear(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td><strong>Total Paid:</strong></td>
                    <td className="amount-cell">
                      <strong>{formatCurrency(totalPaid)}</strong>
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                  {totalUnpaid > 0 && (
                    <tr className="unpaid-total-row">
                      <td><strong>Total Unpaid:</strong></td>
                      <td className="amount-cell unpaid-amount">
                        <strong>{formatCurrency(totalUnpaid)}</strong>
                      </td>
                      <td colSpan="4"></td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="no-history">
              No subscription history found for this family.
            </div>
          )}
        </div>
      )}

      {/* Instructions (when no family selected) */}
      {!selectedFamily && (
        <div className="subscription-instructions">
          <h3>📋 Instructions</h3>
          <ul>
            <li>Search and select a family to manage their annual subscription</li>
            <li>Annual subscription is a yearly donation to the church</li>
            <li><strong>Add Payment:</strong> Click the button above the table. Choose <em>Single Year</em> or <em>Multiple Years</em> mode.</li>
            <li><strong>Multiple Years:</strong> Select unpaid years, enter amount per year, and optionally add an extra amount that gets applied to the next unpaid year.</li>
            <li><strong>Subscription Table:</strong> View all years. Click <em>Edit</em> to update details or toggle paid/unpaid. Click <em>🗑️</em> to delete a record. Click <em>Pay Now</em> on unpaid rows.</li>
            <li><strong>Change Subscription Amount:</strong> Override the per-year rate; updates all unpaid records immediately.</li>
            <li>Virtual (auto-generated) unpaid rows appear with a dashed border for years with no database record.</li>
            <li>The first payment made by a family automatically sets their subscription rate.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Subscription;
