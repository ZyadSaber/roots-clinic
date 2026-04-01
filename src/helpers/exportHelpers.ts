import jsPDF from "jspdf";
import { RowInput } from "jspdf-autotable";

export const downloadExcel = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  fileName: string,
) => {
  if (!rows || rows.length === 0) return;

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((item) => `"${(item || "").toString().replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    fileName.endsWith(".csv") ? fileName : `${fileName}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadPDF = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  title: string,
  fileName: string,
) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    import("jspdf-autotable").then(({ default: autoTable }) => {
      autoTable(doc, {
        head: [headers],
        body: rows as RowInput[],
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
