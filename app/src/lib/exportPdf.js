// exportPdf.js — render the editor's element list to a jsPDF doc (vector text).
// Pure: editor state in -> jsPDF doc out. Mirrors the canvas 1:1 (both use mm).
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { hexToRgb } from "./pdf.js";
import { A4, PT_PER_MM } from "../editor/model.js";

function fontStyle(el) {
  if (el.bold && el.italic) return "bolditalic";
  if (el.bold) return "bold";
  if (el.italic) return "italic";
  return "normal";
}

export function exportEditorPdf(editor) {
  const { letterhead, elements } = editor;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  if (letterhead?.dataUrl) {
    doc.addImage(letterhead.dataUrl, "JPEG", 0, 0, A4.wMm, A4.hMm);
  }

  for (const el of elements) {
    if (el.type === "text") {
      doc.setFont("helvetica", fontStyle(el));
      doc.setFontSize(el.fontPt);
      const [r, g, b] = hexToRgb(el.color);
      doc.setTextColor(r, g, b);

      const lines = doc.splitTextToSize(el.text || "", el.wMm);
      // first baseline ~ top + cap height; matches the CSS box reasonably
      const baseline = el.yMm + (el.fontPt / PT_PER_MM) * 0.82;
      const x =
        el.align === "center" ? el.xMm + el.wMm / 2 : el.align === "right" ? el.xMm + el.wMm : el.xMm;

      doc.text(lines, x, baseline, { align: el.align, lineHeightFactor: el.lineHeight || 1.35 });

      if (el.underline) {
        const lineMm = (el.fontPt / PT_PER_MM) * (el.lineHeight || 1.35);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.25);
        lines.forEach((ln, i) => {
          const w = (doc.getStringUnitWidth(ln) * el.fontPt) / PT_PER_MM;
          const ux = el.align === "center" ? x - w / 2 : el.align === "right" ? x - w : x;
          const uy = baseline + i * lineMm + 1;
          doc.line(ux, uy, ux + w, uy);
        });
      }
    } else if (el.type === "image" && el.dataUrl) {
      const hMm = el.wMm * el.aspect;
      doc.addImage(el.dataUrl, "PNG", el.xMm, el.yMm, el.wMm, hMm);
    } else if (el.type === "table") {
      const [hr, hg, hb] = hexToRgb(el.accent);
      const flex = el.colFlex || el.columns.map((_, i) => (i === 0 ? 3 : i === el.columns.length - 1 ? 1.6 : 1));
      const sum = flex.reduce((a, b) => a + b, 0);
      const columnStyles = {};
      el.columns.forEach((c, i) => {
        columnStyles[i] = { halign: c.align, cellWidth: (flex[i] / sum) * el.wMm };
      });
      autoTable(doc, {
        head: [el.columns.map((c) => c.label)],
        body: el.rows,
        startY: el.yMm,
        margin: { left: el.xMm, right: A4.wMm - (el.xMm + el.wMm) },
        tableWidth: el.wMm,
        theme: "grid",
        styles: { font: "helvetica", fontSize: el.fontPt, cellPadding: 1.3, lineWidth: 0.12, lineColor: [180, 180, 180], textColor: [34, 34, 34] },
        headStyles: { fillColor: [hr, hg, hb], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [241, 240, 236] },
        columnStyles,
      });
    } else if (el.type === "rule") {
      const [r, g, b] = hexToRgb(el.color);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(el.thicknessMm || 0.4);
      doc.line(el.xMm, el.yMm, el.xMm + el.wMm, el.yMm);
    }
  }

  return doc;
}

export default exportEditorPdf;
