import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PdfGenerator = ({ targetId = null }) => {
  const generatePdf = () => {
    const element = targetId ? document.getElementById(targetId) : document.body;
    html2canvas(element, { scale: 1 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.7); // JPEG & quality 0.7
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("page.pdf");
    });
  };

  return (
    <button
      onClick={generatePdf}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        backgroundColor: "#8b5e3c",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Generate PDF
    </button>
  );
};

export default PdfGenerator;
