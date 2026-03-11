import jsPDF from "jspdf";

export function generateTablePdf({ title, columns, rows, fileName }) {
  // Landscape A4 to better fit wide tables
  const doc = new jsPDF("l", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 20; // vertical cursor

  // Header: church name and title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "ST MARY'S JACOBITE SYRIAN CATHEDRAL, PALLIKARA",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 8;
  doc.setFontSize(12);
  doc.text(title, pageWidth / 2, y, { align: "center" });

  // Date line
  y += 8;
  const today = new Date().toLocaleDateString("en-GB");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${today}`, 15, y);

  // Table layout
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = y + 10;
  const marginBottom = 20;

  const usableWidth = pageWidth - marginLeft - marginRight;

  // Support optional per-column width weights via `col.width`
  const weights = columns.map((col) => {
    const w = typeof col.width === "number" && col.width > 0 ? col.width : 1;
    return w;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
  const colWidths = weights.map((w) => (usableWidth * w) / totalWeight);

  let currentY = marginTop;

  const drawHeaderRow = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    const headerData = [];
    let headerMaxHeight = 0;

    // First pass: measure text and heights
    columns.forEach((col, index) => {
      const width = colWidths[index];
      const headerText = String(col.header ?? "");
      const lines = doc.splitTextToSize(headerText, width - 4);
      const height = lines.length * 4 + 4; // 4mm per line + padding
      headerData[index] = { lines, height };
      headerMaxHeight = Math.max(headerMaxHeight, height);
    });

    // Second pass: draw cells
    let x = marginLeft;
    columns.forEach((col, index) => {
      const width = colWidths[index];
      const { lines } = headerData[index];
      doc.rect(x, currentY, width, headerMaxHeight);
      if (lines.length) {
        doc.text(lines, x + 2, currentY + 3);
      }
      x += width;
    });

    return headerMaxHeight;
  };

  const ensurePage = () => {
    if (currentY > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      const headerHeight = drawHeaderRow();
      currentY += headerHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
  };

  // Draw header row on first page
  const firstHeaderHeight = drawHeaderRow();
  currentY += firstHeaderHeight;

  // Draw body rows with borders and auto height
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  rows.forEach((row) => {
    ensurePage();

    // Measure row height based on tallest cell
    const cellLinesPerColumn = [];
    let rowHeight = 0;

    columns.forEach((col, index) => {
      const width = colWidths[index];
      const raw = row[col.key];
      const cellText = raw == null ? "" : String(raw);
      const lines = doc.splitTextToSize(cellText, width - 4);
      cellLinesPerColumn[index] = lines;
      const height = lines.length * 4 + 4;
      rowHeight = Math.max(rowHeight, height);
    });

    // Draw rects + text for the row
    let x = marginLeft;
    columns.forEach((col, index) => {
      const width = colWidths[index];
      const lines = cellLinesPerColumn[index];
      doc.rect(x, currentY, width, rowHeight);
      if (lines.length) {
        doc.text(lines, x + 2, currentY + 3);
      }
      x += width;
    });

    currentY += rowHeight;
  });

  doc.save(fileName || "report.pdf");
}

// --- Single-record certificates (portrait A4) with table layout ---

function createCertificateDoc(title) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Church name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "ST MARY'S JACOBITE SYRIAN CATHEDRAL, PALLIKARA",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Decorative line under church name
  doc.setDrawColor(139, 90, 43);
  doc.setLineWidth(0.6);
  doc.line(margin + 15, 26, pageWidth - margin - 15, 26);

  // Certificate title
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, 35, { align: "center" });

  // Thin line under title
  doc.setLineWidth(0.3);
  doc.line(margin + 30, 38, pageWidth - margin - 30, 38);

  return { doc, pageWidth, pageHeight, margin };
}

/**
 * Draws a bordered table row with label + value cells
 * Returns the height of the row drawn.
 */
function drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label, value, lineHeight = 6, padding = 3 }) {
  const safeValue = value == null ? "" : Array.isArray(value) ? value.join(" ") : String(value);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const labelLines = doc.splitTextToSize(label, labelWidth - 2 * padding);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const valueLines = doc.splitTextToSize(safeValue, valueWidth - 2 * padding);

  const maxLines = Math.max(labelLines.length, valueLines.length, 1);
  const rowHeight = maxLines * lineHeight + 2 * padding;

  // Draw cell borders
  doc.setDrawColor(160, 130, 100);
  doc.setLineWidth(0.25);
  // Label cell
  doc.rect(labelX, y, labelWidth, rowHeight);
  // Value cell
  doc.rect(labelX + labelWidth, y, valueWidth, rowHeight);

  // Fill label cell background (light cream)
  doc.setFillColor(248, 243, 235);
  doc.rect(labelX, y, labelWidth, rowHeight, "F");
  // Redraw border over fill
  doc.setDrawColor(160, 130, 100);
  doc.rect(labelX, y, labelWidth, rowHeight);
  doc.rect(labelX + labelWidth, y, valueWidth, rowHeight);

  // Write text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  labelLines.forEach((line, i) => {
    doc.text(line, labelX + padding, y + padding + 3 + i * lineHeight);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  valueLines.forEach((line, i) => {
    doc.text(line, labelX + labelWidth + padding, y + padding + 3 + i * lineHeight);
  });

  return rowHeight;
}

/**
 * Draws a section header row spanning the full table width
 */
function drawSectionHeader(doc, { y, labelX, totalWidth, text, lineHeight = 6, padding = 3 }) {
  const rowHeight = lineHeight + 2 * padding;

  // Background fill (slightly darker cream)
  doc.setFillColor(235, 222, 205);
  doc.rect(labelX, y, totalWidth, rowHeight, "F");

  // Border
  doc.setDrawColor(160, 130, 100);
  doc.setLineWidth(0.25);
  doc.rect(labelX, y, totalWidth, rowHeight);

  // Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, labelX + totalWidth / 2, y + padding + 4, { align: "center" });

  return rowHeight;
}

function drawCertFooter(doc, pageWidth, y, margin) {
  y += 15; // extra gap after table
  const certText = "Certified that the above information is a true extract taken from the registers maintained at the Church.";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(certText, pageWidth - 2 * margin - 10);
  doc.text(lines, margin + 5, y);
  y += lines.length * 6 + 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString("en-GB");
  doc.text(`Date: ${today}`, margin + 5, y);

  // Signature line
  doc.setDrawColor(100, 80, 60);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - margin - 60, y + 12, pageWidth - margin - 5, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Vicar", pageWidth - margin - 33, y + 18, { align: "center" });
}

// ============================================================
// DEATH CERTIFICATE
// ============================================================
export function generateDeathCertificatePdf(record) {
  const { doc, pageWidth, pageHeight, margin } = createCertificateDoc("Death Certificate");

  const labelX = margin + 3;
  const labelWidth = 65;
  const valueWidth = pageWidth - 2 * margin - 6 - labelWidth;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "";
  const regNo = record.reg_no || "";

  let y = 44;

  const fields = [
    ["Reg. No.", regNo],
    ["Name", record.name],
    ["Age", record.age ? `${record.age} years` : ""],
    ["House Name", record.house_name],
    ["Address", record.address_place],
    ["Husband's / Father's Name", record.father_husband_name],
    ["Date of Demise", formatDate(record.death_date)],
    ["Cause of Death", record.cause_of_death],
    ["Date of Funeral", formatDate(record.burial_date)],
    ["Funeral Conducted by", record.conducted_by],
  ];

  fields.forEach(([label, value]) => {
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label, value });
  });

  if (y > pageHeight - 50) { doc.addPage(); y = 20; }
  y += 10;
  drawCertFooter(doc, pageWidth, y, margin);

  doc.save(`death_certificate_${regNo || record.name || "record"}.pdf`);
}

// ============================================================
// BAPTISM CERTIFICATE
// ============================================================
export function generateBaptismCertificatePdf(record) {
  const { doc, pageWidth, pageHeight, margin } = createCertificateDoc("Baptism Certificate");

  const labelX = margin + 3;
  const labelWidth = 72;
  const valueWidth = pageWidth - 2 * margin - 6 - labelWidth;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "";
  const regNo = record.reg_no || "";

  let y = 44;

  const fields = [
    ["Reg. No.", regNo],
    ["Baptism Name of Child", record.bapt_name],
    ["Name of Child (Official)", record.member_name],
    ["Address", record.address],
    ["Gender", record.gender],
    ["Father's Name", record.father_name],
    ["Mother's Name", record.mother_name],
    ["Date of Birth", formatDate(record.member_dob)],
    ["Date of Baptism", formatDate(record.date_of_baptism)],
    ["Godfather / Godmother", record.godparent_name],
    ["Address of Godparent", record.godparent_house_name],
    ["Church where Baptized", record.church_where_baptised],
    ["Baptised By", record.baptised_by],
  ];

  fields.forEach(([label, value]) => {
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label, value });
  });

  if (y > pageHeight - 50) { doc.addPage(); y = 20; }
  y += 10;
  drawCertFooter(doc, pageWidth, y, margin);

  doc.save(`baptism_certificate_${regNo || record.member_name || "record"}.pdf`);
}

// ============================================================
// MARRIAGE CERTIFICATE
// ============================================================
export function generateMarriageCertificatePdf(record) {
  const { doc, pageWidth, pageHeight, margin } = createCertificateDoc("Marriage Certificate");

  const labelX = margin + 3;
  const labelWidth = 60;
  const totalWidth = pageWidth - 2 * margin - 6;
  const valueWidth = totalWidth - labelWidth;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "";
  const regNo = record.reg_no || "";

  let y = 44;

  const checkPage = () => { if (y > pageHeight - 40) { doc.addPage(); y = 20; } };

  // Reg No
  y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label: "Reg. No.", value: regNo });

  // ---- Groom Section ----
  checkPage();
  y += drawSectionHeader(doc, { y, labelX, totalWidth, text: "GROOM" });

  const groomFields = [
    ["Name", record.spouse1_name],
    ["Address", record.spouse1_address],
    ["City & District", record.spouse1_city_district],
    ["State & Country", record.spouse1_state_country],
    ["Father's Name", record.spouse1_father_name],
    ["Mother's Name", record.spouse1_mother_name],
    ["Name of Parish", record.spouse1_home_parish],
  ];
  groomFields.forEach(([label, value]) => {
    checkPage();
    y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label, value });
  });

  // ---- Bride Section ----
  checkPage();
  y += drawSectionHeader(doc, { y, labelX, totalWidth, text: "BRIDE" });

  const brideFields = [
    ["Name", record.spouse2_name],
    ["Address", record.spouse2_address],
    ["City & District", record.spouse2_city_district],
    ["State & Country", record.spouse2_state_country],
    ["Father's Name", record.spouse2_father_name],
    ["Mother's Name", record.spouse2_mother_name],
    ["Name of Parish", record.spouse2_home_parish],
  ];
  brideFields.forEach(([label, value]) => {
    checkPage();
    y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label, value });
  });

  // ---- Marriage Details ----
  checkPage();
  y += drawSectionHeader(doc, { y, labelX, totalWidth, text: "MARRIAGE DETAILS" });

  checkPage();
  y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label: "Date of Marriage", value: formatDate(record.date) });
  checkPage();
  y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label: "Place of Marriage", value: record.place });
  checkPage();
  y += drawTableRow(doc, { y, labelX, labelWidth, valueWidth, label: "Solemnized By", value: record.solemnized_by });

  if (y > pageHeight - 50) { doc.addPage(); y = 20; }

  y += 15; // extra gap after table
  const certText = "Certified that the above marriage was solemnised according to the rites of the Church and is a true extract from the marriage register.";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(certText, pageWidth - 2 * margin - 10);
  doc.text(lines, margin + 5, y);
  y += lines.length * 6 + 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString("en-GB");
  doc.text(`Date: ${today}`, margin + 5, y);

  doc.setDrawColor(100, 80, 60);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - margin - 60, y + 12, pageWidth - margin - 5, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Vicar", pageWidth - margin - 33, y + 18, { align: "center" });

  doc.save(`marriage_certificate_${regNo || "record"}.pdf`);
}


