// pdf.js — the core PDF engine. Pure: data in -> jsPDF doc out. No React, no storage.
// A4, unit mm (210 x 297). buildPDF(config) returns a jsPDF doc; caller saves/previews.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_W = 210;
const PAGE_H = 297;

// ---- helpers ---------------------------------------------------------------

export function hexToRgb(hex) {
  const h = String(hex || "#1A2456").replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

const nf = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(n, currency) {
  const v = nf.format(Number(n) || 0);
  return currency ? `${currency} ${v}` : v;
}

// row amount = explicit amount, else qty*unit
function rowAmount(item) {
  if (item.amount !== "" && item.amount != null && !Number.isNaN(Number(item.amount))) {
    return Number(item.amount);
  }
  return (Number(item.qty) || 0) * (Number(item.unit) || 0);
}

export function computeTotals(items, vatPercent) {
  const subtotal = items.reduce((s, it) => s + rowAmount(it), 0);
  const vat = subtotal * ((Number(vatPercent) || 0) / 100);
  return { subtotal, vat, total: subtotal + vat };
}

// background image first, on every page (PROMPT §8)
function paintBackground(doc, dataUrl) {
  if (dataUrl) {
    doc.addImage(dataUrl, "JPEG", 0, 0, PAGE_W, PAGE_H);
  }
}

// auto-shrink for long lists (PROMPT §8). Padding tightens with density so the
// common 29-30 row invoice fits one A4 page.
function itemDensity(rows) {
  if (rows > 24) return { fontSize: 7.4, padV: 0.9 };
  if (rows > 16) return { fontSize: 8, padV: 1.3 };
  return { fontSize: 8.6, padV: 1.7 };
}

// shared signature block: rule + name (bold) + title (muted)
function drawSignature(doc, signature, x, sigY, width = 60) {
  if (!signature || !(signature.name || signature.title)) return;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(x, sigY, x + width, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(signature.name || "", x, sigY + 5);
  if (signature.title) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8.5);
    doc.text(signature.title, x, sigY + 9.5);
  }
}

// ---- letter mode -----------------------------------------------------------
// Free-form correspondence: ref/date row, subject, salutation, body, signature.
function buildLetter(doc, config, ctx) {
  const { accentRgb, side, top, bottomLimit, contentRight } = ctx;
  const {
    refLabel = "REF",
    refNumber = "",
    date = "",
    subject = "",
    salutation = "",
    body = "",
    closingLine = "",
    signature = {},
  } = config;

  let y = top;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  if (refNumber) doc.text(`${refLabel}:  ${refNumber}`, side, y);
  if (date) doc.text(date, contentRight, y, { align: "right" });
  y += 11;

  if (subject) {
    const subj = subject.toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...accentRgb);
    doc.text(subj, side, y);
    const w = doc.getTextWidth(subj);
    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.3);
    doc.line(side, y + 1.6, side + w, y + 1.6);
    y += 10;
  }

  if (salutation) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text(salutation, side, y);
    y += 8;
  }

  if (body) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    // blank line separates paragraphs
    body.split(/\n\s*\n/).forEach((p) => {
      const lines = doc.splitTextToSize(p.trim(), contentRight - side);
      doc.text(lines, side, y, { lineHeightFactor: 1.4 });
      y += lines.length * 5.4 + 4;
    });
  }

  if (closingLine) {
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text(closingLine, side, y);
    y += 6;
  }

  const sigY = Math.min(y + 12, bottomLimit - 14);
  drawSignature(doc, signature, side, Math.max(sigY, y + 6), 60);
  return doc;
}

// ---- statement of account (ledger mode) ------------------------------------
// Serif-leaning. Received vs outstanding stay SEPARATE (never folded together).
function buildStatement(doc, config, ctx) {
  const { accentRgb, side, top, bottomLimit, contentRight } = ctx;
  const {
    letterheadDataUrl = "",
    title = "Statement of Account",
    date = "",
    refLabel = "REF",
    refNumber = "",
    party = {},
    fromBlock = "",
    currency = "",
    opening = 0,
    ledger = [],
    margins = { bottom: 24 },
    closingNote = "",
    signature = {},
  } = config;

  let y = top;
  doc.setFont("times", "bold");
  doc.setTextColor(...accentRgb);
  doc.setFontSize(16);
  doc.text((title || "Statement of Account").toUpperCase(), 105, y, { align: "center" });
  y += 8;
  if (date) {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(date, 105, y, { align: "center" });
    y += 6;
  }
  y += 2;

  // FROM / TO, no boxes
  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...accentRgb);
  doc.text("From:", side, y);
  doc.text("To:", 110, y);
  doc.setFont("times", "normal");
  doc.setTextColor(30, 30, 30);
  const fromLines = doc.splitTextToSize(fromBlock || "", 80);
  const toLines = doc.splitTextToSize(party.address || "", 85);
  doc.text(fromLines, side, y + 5);
  doc.text(toLines, 110, y + 5);
  y += 5 + Math.max(fromLines.length, toLines.length) * 4.4 + 4;

  if (refNumber) {
    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`${refLabel}: ${refNumber}`, side, y);
    y += 6;
  }

  // opening balance line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text("Opening balance:", side, y);
  doc.text(money(opening, currency), contentRight, y, { align: "right" });
  y += 4;

  // running balance per row
  let run = Number(opening) || 0;
  let totDebit = 0;
  let totCredit = 0;
  const body = ledger.map((r) => {
    const d = Number(r.debit) || 0;
    const c = Number(r.credit) || 0;
    run += d - c;
    totDebit += d;
    totCredit += c;
    return [r.date || "", r.ref || "", d ? money(d, "") : "", c ? money(c, "") : "", money(run, "")];
  });

  autoTable(doc, {
    head: [["DATE", "REFERENCE / DESCRIPTION", "DEBIT", "CREDIT", "BALANCE"]],
    body,
    startY: y + 1,
    theme: "grid",
    margin: { top, bottom: margins.bottom, left: side, right: side },
    styles: {
      font: "helvetica",
      fontSize: 8.4,
      cellPadding: { top: 1.4, bottom: 1.4, left: 1.8, right: 1.8 },
      lineWidth: 0.12,
      lineColor: [190, 190, 190],
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: accentRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.4,
    },
    alternateRowStyles: { fillColor: [244, 241, 234] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    willDrawPage: (d) => {
      if (d.pageNumber > 1) paintBackground(doc, letterheadDataUrl);
    },
  });

  let cursor = doc.lastAutoTable.finalY + 7;
  const closing = (Number(opening) || 0) + totDebit - totCredit;
  const outstanding = Math.max(closing, 0);

  // reconciliation summary, bottom-right
  const boxW = 82;
  const boxX = contentRight - boxW;
  const lx = boxX + 2;
  const vx = contentRight - 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text("Total charges (Debit)", lx, cursor);
  doc.text(money(totDebit, currency), vx, cursor, { align: "right" });
  cursor += 5.5;
  doc.text("Total received (Credit)", lx, cursor);
  doc.text(money(totCredit, currency), vx, cursor, { align: "right" });
  cursor += 5.5;
  if (outstanding > 0) {
    // dark red reserved ONLY for an outstanding/owed figure
    doc.setFont("helvetica", "bold");
    doc.setTextColor(160, 40, 35);
    doc.text("Outstanding", lx, cursor);
    doc.text(money(outstanding, currency), vx, cursor, { align: "right" });
    cursor += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
  }
  // closing balance in accent band
  doc.setFillColor(...accentRgb);
  doc.rect(boxX, cursor - 5, boxW, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CLOSING BALANCE", lx, cursor + 1);
  doc.text(money(closing, currency), vx, cursor + 1, { align: "right" });
  cursor += 10;

  // footer note (left)
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    closingNote || "This statement is issued for account reconciliation purposes.",
    side,
    Math.min(cursor + 4, bottomLimit - 16)
  );

  drawSignature(doc, signature, contentRight - 60, bottomLimit - 14, 60);
  return doc;
}

// ---- main ------------------------------------------------------------------

export function buildPDF(config = {}) {
  const {
    docType = "tax-invoice",
    letterheadDataUrl = "",
    accent = "#1A2456",
    margins = { top: 52, bottom: 26, side: 24 },
    title = "",
    subTitle = "",
    refLabel = "NO",
    refNumber = "",
    date = "",
    party = {},
    currency = "",
    items = [],
    vatPercent = 0,
    showAmountInWords = true,
    amountInWords = "",
    intro = "",
    validity = "",
    bank = null,
    closingNote = "",
    signature = {},
  } = config;

  const accentRgb = hexToRgb(accent);
  const side = margins.side;
  const top = margins.top;
  const bottomLimit = PAGE_H - margins.bottom;
  const contentRight = PAGE_W - side;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // page 1 background drawn manually BEFORE header so willDrawPage can skip it
  paintBackground(doc, letterheadDataUrl);

  // ledger + correspondence modes have their own layouts
  const ctx = { accentRgb, side, top, bottomLimit, contentRight };
  if (docType === "letter") return buildLetter(doc, config, ctx);
  if (docType === "statement") return buildStatement(doc, config, ctx);

  let y = top;

  // --- title -----------------------------------------------------------------
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accentRgb);
    doc.setFontSize(17);
    doc.text(title.toUpperCase(), PAGE_W / 2, y, { align: "center" });
    y += 7;
    if (subTitle) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.text(subTitle.toUpperCase(), PAGE_W / 2, y, { align: "center" });
      y += 6;
    }
    y += 3;
  }

  // --- ref (left) + date box (right) ----------------------------------------
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  if (refNumber) {
    doc.text(`${refLabel}:  ${refNumber}`, side, y);
  }
  if (date) {
    const boxW = 58;
    const boxH = 8;
    const boxX = contentRight - boxW;
    const boxY = y - 5.5;
    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.text(`DATE:  ${date}`, boxX + 3, y);
  }
  y += 8;

  // --- quotation/proforma intro paragraph -----------------------------------
  if ((docType === "quotation" || docType === "proforma") && intro) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(intro, contentRight - side);
    doc.text(lines, side, y);
    y += lines.length * 4.6 + 2;
  }

  // --- parties block ---------------------------------------------------------
  const partyTopY = y;
  if (party.address || party.label) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...accentRgb);
    doc.text(`${party.label || "Bill To"}:`, side, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const addrLines = doc.splitTextToSize(party.address || "", 90);
    doc.text(addrLines, side, y + 5);
    y += 5 + addrLines.length * 4.4;
  }
  // TRNs right-aligned at the parties top
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  let trnY = partyTopY;
  if (party.ownTrn) {
    doc.setFont("helvetica", "bold");
    doc.text(`TRN: ${party.ownTrn}`, contentRight, trnY, { align: "right" });
    trnY += 5;
  }
  if (party.clientTrn) {
    doc.setFont("helvetica", "normal");
    doc.text(`Client TRN: ${party.clientTrn}`, contentRight, trnY, {
      align: "right",
    });
    trnY += 5;
  }
  y = Math.max(y, trnY) + 4;

  // --- line-items table ------------------------------------------------------
  const { fontSize, padV } = itemDensity(items.length);
  const body = items.map((it, i) => [
    String(i + 1),
    it.description || "",
    it.qty === "" || it.qty == null ? "" : String(it.qty),
    it.unit === "" || it.unit == null ? "" : money(it.unit, ""),
    money(rowAmount(it), ""),
  ]);

  autoTable(doc, {
    head: [["NO.", "DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
    body,
    startY: y,
    theme: "grid",
    margin: { top, bottom: margins.bottom, left: side, right: side },
    styles: {
      font: "helvetica",
      fontSize,
      cellPadding: { top: padV, bottom: padV, left: 1.8, right: 1.8 },
      lineWidth: 0.15,
      lineColor: [180, 180, 180],
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: accentRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: fontSize + 0.2,
    },
    alternateRowStyles: { fillColor: [238, 242, 250] },
    columnStyles: {
      0: { cellWidth: 11, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    // page-break background gotcha: willDrawPage fires BEFORE rows on each page,
    // so the bg sits BENEATH the table. Skip page 1 (already painted before header).
    willDrawPage: (data) => {
      if (data.pageNumber > 1) paintBackground(doc, letterheadDataUrl);
    },
  });

  let cursor = doc.lastAutoTable.finalY + 6;
  const { subtotal, vat, total } = computeTotals(items, vatPercent);

  // --- totals block (right-aligned) -----------------------------------------
  const totW = 70;
  const totX = contentRight - totW;
  const labelX = totX + 2;
  const valX = contentRight - 2;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text("Subtotal", labelX, cursor);
  doc.text(money(subtotal, currency), valX, cursor, { align: "right" });
  cursor += 6;

  if (Number(vatPercent) > 0) {
    doc.text(`VAT (${vatPercent}%)`, labelX, cursor);
    doc.text(money(vat, currency), valX, cursor, { align: "right" });
    cursor += 6;
  }

  // Total in filled accent band, white bold
  const bandH = 9;
  doc.setFillColor(...accentRgb);
  doc.rect(totX, cursor - 6, totW, bandH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", labelX, cursor);
  doc.text(money(total, currency), valX, cursor, { align: "right" });
  cursor += bandH;

  // Reserve room for the signature so optional blocks never collide with the
  // footer. fits(h) = this block + signature still clear the bottom margin.
  const sigReserve = signature && (signature.name || signature.title) ? 18 : 2;
  const fits = (h) => cursor + h <= bottomLimit - sigReserve;

  // --- amount in words -------------------------------------------------------
  if (showAmountInWords && amountInWords) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    const w = doc.splitTextToSize(
      `Amount in words: ${amountInWords}`,
      contentRight - side
    );
    if (fits(w.length * 4.4 + 2)) {
      doc.setTextColor(50, 50, 50);
      doc.text(w, side, cursor);
      cursor += w.length * 4.4 + 2;
    }
  }

  // --- bank details (optional; dropped first when space is tight) ------------
  if (bank && (bank.heading || (bank.lines && bank.lines.length))) {
    const lines = bank.lines || [];
    const bankH = 5 + lines.length * 4.6 + 2;
    if (fits(bankH)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...accentRgb);
      doc.text(bank.heading || "Bank Details", side, cursor);
      cursor += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      lines.forEach((line) => {
        doc.text(line, side, cursor);
        cursor += 4.6;
      });
      cursor += 2;
    }
  }

  // --- quotation validity line ----------------------------------------------
  if ((docType === "quotation" || docType === "proforma") && validity && fits(6)) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(validity, side, cursor);
    cursor += 6;
  }

  // --- closing note ----------------------------------------------------------
  if (closingNote) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    const n = doc.splitTextToSize(closingNote, contentRight - side);
    if (fits(n.length * 4.4 + 2)) {
      doc.setTextColor(90, 90, 90);
      doc.text(n, side, cursor);
      cursor += n.length * 4.4 + 2;
    }
  }

  // --- signature (bottom-right, clamped above footer) ------------------------
  if (signature && (signature.name || signature.title)) {
    const sigW = 60;
    const sigX = contentRight - sigW;
    // sit just below the content but never past the footer margin
    let sigY = Math.min(cursor + 10, bottomLimit - 14);
    if (sigY < cursor + 6) sigY = cursor + 6;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigY, contentRight, sigY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(signature.name || "", sigX, sigY + 5);
    if (signature.title) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(8.5);
      doc.text(signature.title, sigX, sigY + 9.5);
    }
  }

  return doc;
}

export default buildPDF;
