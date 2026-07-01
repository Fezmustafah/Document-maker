// invoiceLayouts.js — STRUCTURAL layouts for the tax invoice. A layout decides
// WHERE each block sits (seller, buyer, meta, items, totals, bank, signature);
// the colour SKIN (settings.theme) is orthogonal and comes through `T`.
//
// Four layouts, modelled on common real-world invoice styles:
//   standard — both parties in boxes side-by-side, meta row, table, totals right.
//   sidebar  — coloured left rail holds seller + bank; buyer/table on the right.
//   centered — seller lives in the header; buyer highlighted left, meta list right.
//   compact  — letter style: plain seller top-left, meta top-right, one bill-to band.
//
// On a user letterhead the sidebar rail would cover the image, so the dispatcher
// falls back to `standard` for letterheads (the other three sit inside the safe
// zone and work on a letterhead too).
import {
  PAGE, fill, stroke, ink,
  drawHeader, drawTitle, drawSignature, drawFooter, drawLetterheadBg,
  partyBox, partyBodyHeight, PARTY_HEADER_H, tableHeadBand, totalBox, moneyRow, bankBox,
} from "./pdfShared.js";
import { money, dateLong, invoiceNo, totals, orderLines, extraLines } from "./format.js";

const { w: W, h: H, margin: M } = PAGE;
const RIGHT = W - M;

function sellerLines(seller) {
  return [
    { text: seller.name, bold: true, size: 9.5 },
    { text: seller.address },
    { text: seller.phone },
    { text: seller.email },
    { text: `TRN: ${seller.trn}`, bold: true },
    ...extraLines(seller),
  ];
}
function buyerLines(buyer) {
  return [
    { text: buyer.name, bold: true, size: 9.5 },
    { text: buyer.address || "—" },
    { text: `Tel: ${buyer.phone}` },
    { text: `TRN: ${buyer.trn}`, bold: true },
    ...extraLines(buyer),
  ];
}

// Items table drawn at (x, top) with width w. Adapts columns for narrow columns
// (sidebar main area). Returns the y at the bottom rule.
function itemsTable(doc, T, x, top, w, order) {
  const c = T.c;
  const rightX = x + w;
  const narrow = w < 150;
  const qtyR = rightX - (narrow ? 50 : 64);
  const unitR = rightX - (narrow ? 24 : 30);
  const amtR = rightX;
  tableHeadBand(doc, T, x, top, w, 8, [
    { text: "#", x: x + 4 },
    { text: "Description", x: x + 12 },
    { text: "Qty", x: qtyR, align: "right" },
    { text: narrow ? "Unit" : "Unit Price (AED)", x: unitR, align: "right" },
    { text: "Amount (AED)", x: amtR, align: "right" },
  ]);
  const lns = orderLines(order);
  const rowH = 8;
  const rowsTop = top + 8;
  lns.forEach((l, i) => {
    const ry = rowsTop + i * rowH;
    if (i % 2 === 1) {
      fill(doc, c.panel);
      doc.rect(x, ry, w, rowH, "F");
    }
    ink(doc, c.text);
    doc.setFont(T.font.body, "normal").setFontSize(narrow ? 8 : 9);
    const by = ry + 5.6;
    doc.text(String(i + 1), x + 4, by);
    doc.text(doc.splitTextToSize(l.item || "", qtyR - (x + 12) - 3)[0] || "", x + 12, by);
    doc.text(String(l.qty), qtyR, by, { align: "right" });
    doc.text(money(l.unitPrice), unitR, by, { align: "right" });
    doc.text(money(l.amount ?? l.qty * l.unitPrice), amtR, by, { align: "right" });
  });
  const bottom = rowsTop + lns.length * rowH;
  stroke(doc, T.minimal ? c.muted : c.primary);
  doc.setLineWidth(0.5);
  doc.line(x, bottom, rightX, bottom);
  return bottom;
}

// Right-aligned totals stack ending in the TOTAL chip. Returns y below the chip.
function totalsRight(doc, T, rightX, y, t, vatRate) {
  const c = T.c;
  moneyRow(doc, "Subtotal", t.subtotal, rightX, y, { color: c.text, font: T.font.body });
  y += 6;
  moneyRow(doc, `VAT (${vatRate}%)`, t.vat, rightX, y, { color: c.text, font: T.font.body });
  y += 3;
  if (!T.minimal) {
    stroke(doc, c.primary);
    doc.setLineWidth(0.4);
    doc.line(rightX - 70, y, rightX, y);
  }
  y += 4;
  totalBox(doc, T, rightX - 70, y, 70, 10, "TOTAL", `AED ${money(t.total)}`, 11);
  return y + 10;
}

// terms + bank (left) + signature (right) + footer — shared by the non-rail
// layouts. `y` is where the terms begin.
function bottomBlock(doc, T, ctx, y) {
  const { seller, sig, useLh, letterhead } = ctx;
  ink(doc, T.c.muted);
  doc.setFont(T.font.body, "normal").setFontSize(7.5);
  doc.text("All amounts are in AED (United Arab Emirates Dirham), inclusive of 5% VAT where applicable.", M, y);
  doc.text("Payment due on receipt. Thank you for your business.", M, y + 4);
  bankBox(doc, T, M, y + 10, 104, seller.bank);
  const sigLineY = useLh ? H - (letterhead.marginBottom || 20) - 8 : Math.min(y + 30, H - 24);
  drawSignature(doc, sig, RIGHT, sigLineY, T);
  if (!useLh) drawFooter(doc, seller, T);
}

// Delivery-site strip (the supply location for THIS delivery).
function deliveryBand(doc, T, x, y, w, order) {
  const c = T.c;
  if (T.minimal) {
    ink(doc, c.muted);
    doc.setFont(T.font.body, "bold").setFontSize(8);
    doc.text("DELIVERY SITE", x, y + 5.7);
    ink(doc, c.text);
    doc.setFont(T.font.body, "bold").setFontSize(10);
    doc.text(order.location || "—", x + 35, y + 5.9);
    stroke(doc, c.panelEdge);
    doc.setLineWidth(0.3);
    doc.line(x, y + 9, x + w, y + 9);
  } else {
    fill(doc, c.panel);
    stroke(doc, c.panelEdge);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, 9, 1.5, 1.5, "FD");
    fill(doc, c.accent);
    doc.rect(x, y, 1.6, 9, "F");
    ink(doc, c.primary);
    doc.setFont("helvetica", "bold").setFontSize(8);
    doc.text("DELIVERY SITE", x + 5, y + 5.7);
    ink(doc, c.text);
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text(order.location || "—", x + 35, y + 5.9);
  }
  return y + 9;
}

function drawTop(doc, T, ctx) {
  // returns titleY; draws header (drawn or letterhead)
  if (ctx.useLh) {
    drawLetterheadBg(doc, ctx.letterhead);
    return (ctx.letterhead.marginTop || 40) + 8;
  }
  drawHeader(doc, ctx.seller, T);
  return 42;
}

// ---------------------------------------------------------------- STANDARD ----
function standard(doc, T, ctx) {
  const c = T.c;
  const { seller, buyer, order, date, index, vatRate } = ctx;
  const titleY = drawTop(doc, T, ctx);
  drawTitle(doc, "TAX INVOICE", titleY, T);

  const metaY = titleY + 11;
  ink(doc, c.text);
  doc.setFont(T.font.body, "bold").setFontSize(9.5);
  doc.text(`Invoice No: ${invoiceNo(date, index)}`, M, metaY);
  doc.setFont(T.font.body, "normal");
  doc.text(`Date: ${dateLong(date)}`, RIGHT, metaY, { align: "right" });

  const boxW = 82;
  const rightBoxX = M + boxW + (W - M * 2 - boxW * 2);
  const boxY = titleY + 16;
  const sl = sellerLines(seller);
  const bl = buyerLines(buyer);
  const bodyH = Math.max(partyBodyHeight(doc, T, boxW, sl), partyBodyHeight(doc, T, boxW, bl));
  partyBox(doc, T, M, boxY, boxW, "FROM (SELLER)", sl, bodyH);
  partyBox(doc, T, rightBoxX, boxY, boxW, "BILL TO (BUYER)", bl, bodyH);

  const bandBottom = deliveryBand(doc, T, M, boxY + PARTY_HEADER_H + bodyH + 6, W - M * 2, order);
  const tableBottom = itemsTable(doc, T, M, bandBottom + 6, W - M * 2, order);

  const t = totals([order], vatRate);
  const afterTotals = totalsRight(doc, T, RIGHT, tableBottom + 9, t, vatRate);
  ink(doc, T.minimal ? c.muted : c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text(`Total Quantity Supplied: ${t.qty} Parcels`, M, tableBottom + 15.6);
  bottomBlock(doc, T, ctx, afterTotals + 3);
}

// ----------------------------------------------------------------- SIDEBAR ----
// Coloured full-height left rail (seller + PAY TO bank). Main column on the
// right: title, meta, BILL TO, delivery, table, totals. Drawn-header only.
function sidebar(doc, T, ctx) {
  const c = T.c;
  const { seller, buyer, order, date, index, vatRate, sig } = ctx;
  const railW = 64;
  const onDark = !T.minimal;
  if (onDark) {
    fill(doc, c.primary);
    doc.rect(0, 0, railW, H, "F");
    fill(doc, c.accent);
    doc.rect(railW - 1.6, 0, 1.6, H, "F");
  } else {
    fill(doc, c.panel);
    doc.rect(0, 0, railW, H, "F");
    stroke(doc, c.panelEdge);
    doc.setLineWidth(0.4);
    doc.line(railW, 0, railW, H);
  }
  const body = onDark ? c.white : c.text;
  const label = onDark ? c.accent : c.muted;
  const rx = 8;

  // rail: wordmark
  ink(doc, onDark ? c.white : c.primary);
  doc.setFont(T.font.display, "bold").setFontSize(15);
  doc.text("BAIT AL", rx, 18);
  doc.text("MADINA", rx, 25);
  ink(doc, label);
  doc.setFont(T.font.body, "normal").setFontSize(7);
  doc.setCharSpace?.(0.6);
  doc.text("TRADITIONAL KITCHEN", rx, 30);
  doc.setCharSpace?.(0);

  // rail: seller block
  let ry = 42;
  ink(doc, label);
  doc.setFont(T.font.body, "bold").setFontSize(7.5);
  doc.text("FROM", rx, ry);
  ry += 5;
  for (const ln of sellerLines(seller)) {
    ink(doc, body);
    doc.setFont(T.font.body, ln.bold ? "bold" : "normal").setFontSize(ln.size ? 8 : 7.5);
    const wrapped = doc.splitTextToSize(ln.text, railW - rx - 4);
    doc.text(wrapped, rx, ry);
    ry += wrapped.length * 4;
  }

  // rail: PAY TO bank details
  const bank = seller.bank || {};
  const bankRows = [["Bank", bank.bankName], ["A/C Name", bank.accountName], ["A/C No", bank.accountNo], ["IBAN", bank.iban], ["SWIFT", bank.swift]].filter(([, v]) => v && String(v).trim());
  if (bankRows.length) {
    ry = Math.max(ry + 6, 150);
    ink(doc, label);
    doc.setFont(T.font.body, "bold").setFontSize(7.5);
    doc.text("PAY TO", rx, ry);
    ry += 5;
    for (const [k, v] of bankRows) {
      ink(doc, label);
      doc.setFont(T.font.body, "normal").setFontSize(6.5);
      doc.text(k, rx, ry);
      ink(doc, body);
      doc.setFont(T.font.body, "bold").setFontSize(7);
      doc.text(doc.splitTextToSize(String(v), railW - rx - 4), rx, ry + 3.4);
      ry += 8.4;
    }
  }

  // ---- main column ----
  const mx = railW + 8;
  ink(doc, c.primary);
  doc.setFont(T.font.display, "bold").setFontSize(24);
  doc.text("TAX INVOICE", RIGHT, 24, { align: "right" });
  stroke(doc, c.accent);
  doc.setLineWidth(0.7);
  doc.line(RIGHT - 52, 27.5, RIGHT, 27.5);

  ink(doc, c.text);
  doc.setFont(T.font.body, "bold").setFontSize(9.5);
  doc.text(`Invoice No: ${invoiceNo(date, index)}`, mx, 38);
  doc.setFont(T.font.body, "normal");
  doc.text(`Date: ${dateLong(date)}`, RIGHT, 38, { align: "right" });

  // BILL TO
  let y = 50;
  ink(doc, c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text("BILL TO", mx, y);
  y += 5;
  for (const ln of buyerLines(buyer)) {
    ink(doc, ln.bold ? c.text : c.muted);
    doc.setFont(T.font.body, ln.bold ? "bold" : "normal").setFontSize(ln.size || 8.5);
    const wrapped = doc.splitTextToSize(ln.text, RIGHT - mx);
    doc.text(wrapped, mx, y);
    y += wrapped.length * 4.3;
  }

  const bandBottom = deliveryBand(doc, T, mx, y + 3, RIGHT - mx, order);
  const tableBottom = itemsTable(doc, T, mx, bandBottom + 6, RIGHT - mx, order);
  const t = totals([order], vatRate);
  const afterTotals = totalsRight(doc, T, RIGHT, tableBottom + 9, t, vatRate);
  ink(doc, T.minimal ? c.muted : c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text(`Total Quantity Supplied: ${t.qty} Parcels`, mx, tableBottom + 15.6);

  // terms + signature (in main column; signature ink shows on white here)
  const termsY = afterTotals + 8;
  ink(doc, c.muted);
  doc.setFont(T.font.body, "normal").setFontSize(7.5);
  doc.text("All amounts in AED, inclusive of 5% VAT where applicable. Payment due on receipt.", mx, termsY);
  drawSignature(doc, sig, RIGHT, Math.min(termsY + 26, H - 20), T);
}

// ----------------------------------------------------------------- CENTERED ---
// Seller lives in the header; the buyer is the highlighted party (left), and the
// invoice meta is a labelled list on the right.
function centered(doc, T, ctx) {
  const c = T.c;
  const { buyer, order, date, index, vatRate } = ctx;
  const titleY = drawTop(doc, T, ctx);
  drawTitle(doc, "TAX INVOICE", titleY, T);

  const rowY = titleY + 14;
  // left: BILL TO (plain, no box)
  ink(doc, c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text("BILL TO", M, rowY);
  let ly = rowY + 5.5;
  for (const ln of buyerLines(buyer)) {
    ink(doc, ln.bold ? c.text : c.muted);
    doc.setFont(T.font.body, ln.bold ? "bold" : "normal").setFontSize(ln.size || 8.5);
    const wrapped = doc.splitTextToSize(ln.text, 92);
    doc.text(wrapped, M, ly);
    ly += wrapped.length * 4.3;
  }
  // right: meta list
  const meta = [
    ["Invoice No", invoiceNo(date, index)],
    ["Date", dateLong(date)],
    ["Delivery Site", order.location || "—"],
  ];
  let my = rowY;
  for (const [k, v] of meta) {
    ink(doc, c.muted);
    doc.setFont(T.font.body, "normal").setFontSize(8);
    doc.text(k, RIGHT - 62, my);
    ink(doc, c.text);
    doc.setFont(T.font.body, "bold").setFontSize(8.5);
    doc.text(doc.splitTextToSize(String(v), 62)[0], RIGHT, my, { align: "right" });
    my += 6;
  }

  const tableTop = Math.max(ly, my) + 6;
  const tableBottom = itemsTable(doc, T, M, tableTop, W - M * 2, order);
  const t = totals([order], vatRate);
  const afterTotals = totalsRight(doc, T, RIGHT, tableBottom + 9, t, vatRate);
  ink(doc, T.minimal ? c.muted : c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text(`Total Quantity Supplied: ${t.qty} Parcels`, M, tableBottom + 15.6);
  bottomBlock(doc, T, ctx, afterTotals + 3);
}

// ----------------------------------------------------------------- COMPACT ----
// Letter style: plain seller top-left, meta top-right, one full-width BILL TO
// band, table, totals boxed right.
function compact(doc, T, ctx) {
  const c = T.c;
  const { seller, buyer, order, date, index, vatRate, useLh, letterhead } = ctx;

  let topY;
  if (useLh) {
    drawLetterheadBg(doc, letterhead);
    topY = (letterhead.marginTop || 40) + 8;
  } else {
    // slim self-drawn seller header
    ink(doc, c.text);
    doc.setFont(T.font.display, "bold").setFontSize(16);
    doc.text(seller.name, M, 19);
    ink(doc, c.muted);
    doc.setFont(T.font.body, "normal").setFontSize(8);
    doc.text(seller.address, M, 24.5);
    doc.text(`${seller.phone}   |   ${seller.email}`, M, 28.5);
    doc.text(`TRN: ${seller.trn}`, M, 32.5);
    stroke(doc, T.minimal ? c.muted : c.primary);
    doc.setLineWidth(0.5);
    doc.line(M, 36, RIGHT, 36);
    topY = 44;
  }

  // title left + meta right
  ink(doc, c.primary);
  doc.setFont(T.font.display, "bold").setFontSize(18);
  doc.text("TAX INVOICE", M, topY);
  stroke(doc, c.accent);
  doc.setLineWidth(0.6);
  doc.line(M, topY + 3, M + 48, topY + 3);

  ink(doc, c.text);
  doc.setFont(T.font.body, "bold").setFontSize(9);
  doc.text(`Invoice No: ${invoiceNo(date, index)}`, RIGHT, topY - 4, { align: "right" });
  doc.setFont(T.font.body, "normal").setFontSize(9);
  doc.text(`Date: ${dateLong(date)}`, RIGHT, topY + 1, { align: "right" });
  doc.text(`Delivery: ${order.location || "—"}`, RIGHT, topY + 6, { align: "right" });

  // BILL TO band
  const bandY = topY + 12;
  const bandH = 12;
  if (T.minimal) {
    stroke(doc, c.panelEdge);
    doc.setLineWidth(0.3);
    doc.line(M, bandY, RIGHT, bandY);
    doc.line(M, bandY + bandH, RIGHT, bandY + bandH);
  } else {
    fill(doc, c.panel);
    stroke(doc, c.panelEdge);
    doc.setLineWidth(0.3);
    doc.rect(M, bandY, W - M * 2, bandH, "FD");
    fill(doc, c.accent);
    doc.rect(M, bandY, 1.6, bandH, "F");
  }
  ink(doc, c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(7.5);
  doc.text("BILL TO", M + 5, bandY + 5);
  ink(doc, c.text);
  doc.setFont(T.font.body, "bold").setFontSize(9.5);
  doc.text(buyer.name, M + 5, bandY + 9.5);
  ink(doc, c.muted);
  doc.setFont(T.font.body, "normal").setFontSize(7.5);
  const addr = (buyer.address || "").replace(/\n/g, ", ");
  doc.text(`${addr}${buyer.trn ? "   |   TRN: " + buyer.trn : ""}`, M + 40, bandY + 9.5);

  const tableBottom = itemsTable(doc, T, M, bandY + bandH + 6, W - M * 2, order);
  const t = totals([order], vatRate);
  const afterTotals = totalsRight(doc, T, RIGHT, tableBottom + 9, t, vatRate);
  ink(doc, T.minimal ? c.muted : c.primary);
  doc.setFont(T.font.body, "bold").setFontSize(8);
  doc.text(`Total Quantity Supplied: ${t.qty} Parcels`, M, tableBottom + 15.6);
  bottomBlock(doc, T, ctx, afterTotals + 3);
}

const LAYOUTS = { standard, sidebar, centered, compact };

// Draw the whole invoice page for the chosen layout onto the current page.
export function drawInvoice(doc, T, ctx, layoutKey) {
  let key = LAYOUTS[layoutKey] ? layoutKey : "standard";
  if (ctx.useLh && key === "sidebar") key = "standard"; // rail would cover the letterhead
  LAYOUTS[key](doc, T, ctx);
}
