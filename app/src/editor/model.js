// model.js — geometry, element factory, and starter templates for the editor.
// Coordinates are in MILLIMETRES on an A4 page (210 x 297). The canvas and the
// PDF both derive from mm, so what you place is exactly what prints.

export const A4 = { wMm: 210, hMm: 297 };
export const PT_PER_MM = 2.834645669; // 1mm = 2.83465pt
export const PXPM = 2.7; // canvas pixels per mm (display only)

let seq = 0;
const uid = () => "el_" + Date.now().toString(36) + "_" + seq++;

export function makeText(p = {}) {
  return {
    id: uid(),
    type: "text",
    xMm: p.xMm ?? 30,
    yMm: p.yMm ?? 60,
    wMm: p.wMm ?? 150,
    text: p.text ?? "New text block",
    fontPt: p.fontPt ?? 11,
    bold: !!p.bold,
    italic: !!p.italic,
    underline: !!p.underline,
    align: p.align ?? "left",
    color: p.color ?? "#222222",
    lineHeight: p.lineHeight ?? 1.35,
  };
}

export function makeImage(p = {}) {
  // signatures/stamps. height derives from aspect, so resizing keeps proportion.
  return {
    id: uid(),
    type: "image",
    xMm: p.xMm ?? 120,
    yMm: p.yMm ?? 210,
    wMm: p.wMm ?? 45,
    aspect: p.aspect ?? 0.5, // h / w
    dataUrl: p.dataUrl ?? "",
    label: p.label ?? "Signature",
  };
}

export function makeTable(p = {}) {
  // pricing / breakdown tables (invoices, quotations, salary certificates).
  return {
    id: uid(),
    type: "table",
    xMm: p.xMm ?? 24,
    yMm: p.yMm ?? 110,
    wMm: p.wMm ?? 162,
    accent: p.accent ?? "#1A2456",
    fontPt: p.fontPt ?? 9.5,
    columns: p.columns ?? [
      { label: "Description", align: "left" },
      { label: "Qty", align: "right" },
      { label: "Unit Price", align: "right" },
      { label: "Amount", align: "right" },
    ],
    colFlex: p.colFlex ?? null, // relative widths; null = auto (first col wider)
    rows: p.rows ?? [
      ["Item description", "1", "0.00", "0.00"],
      ["", "", "", ""],
    ],
  };
}

export function makeRule(p = {}) {
  return {
    id: uid(),
    type: "rule",
    xMm: p.xMm ?? 30,
    yMm: p.yMm ?? 200,
    wMm: p.wMm ?? 60,
    color: p.color ?? "#888888",
    thicknessMm: p.thicknessMm ?? 0.4,
  };
}

export function cloneElement(el, dxMm = 6, dyMm = 6) {
  return { ...el, id: uid(), xMm: el.xMm + dxMm, yMm: el.yMm + dyMm };
}

// ---- starter templates -----------------------------------------------------
// Each returns a fresh element list placed inside the middle (safe) zone.
// accent tints headings; everything is editable/movable/deletable afterward.

export const TEMPLATE_LIST = [
  { id: "quotation", label: "Quotation" },
  { id: "invoice", label: "Invoice" },
  { id: "letter", label: "Letter" },
  { id: "blank", label: "Blank" },
];

export function buildTemplate(id, accent = "#1A2456") {
  const SIDE = 24;
  const W = A4.wMm - SIDE * 2; // 162
  switch (id) {
    case "quotation":
      return [
        makeText({ text: "QUOTATION", xMm: SIDE, yMm: 52, wMm: W, fontPt: 20, bold: true, align: "center", color: accent }),
        makeText({ text: "Ref:  Q-2026-001", xMm: SIDE, yMm: 70, wMm: 80, fontPt: 10, bold: true, color: "#222" }),
        makeText({ text: "Date:  13 / 06 / 2026", xMm: 106, yMm: 70, wMm: 80, fontPt: 10, bold: true, align: "right", color: "#222" }),
        makeText({ text: "To:\nClient Name\nDubai, U.A.E", xMm: SIDE, yMm: 84, wMm: 100, fontPt: 10, color: "#222" }),
        makeText({
          text: "We are pleased to submit our quotation as below. Please review the details and let us know if you require any clarification.",
          xMm: SIDE, yMm: 108, wMm: W, fontPt: 10.5, color: "#222", lineHeight: 1.5,
        }),
        makeText({ text: "This quotation is valid for 30 days from the date above.", xMm: SIDE, yMm: 150, wMm: W, fontPt: 9.5, italic: true, color: "#555" }),
        makeRule({ xMm: 126, yMm: 224, wMm: 60, color: "#888" }),
        makeText({ text: "Full Name", xMm: 126, yMm: 226, wMm: 60, fontPt: 10, bold: true, color: "#222" }),
        makeText({ text: "Authorised Signatory", xMm: 126, yMm: 231, wMm: 60, fontPt: 8.5, color: "#666" }),
      ];
    case "invoice":
      return [
        makeText({ text: "INVOICE", xMm: SIDE, yMm: 52, wMm: W, fontPt: 20, bold: true, align: "center", color: accent }),
        makeText({ text: "No:  INV-2026-001", xMm: SIDE, yMm: 70, wMm: 80, fontPt: 10, bold: true, color: "#222" }),
        makeText({ text: "Date:  13 / 06 / 2026", xMm: 106, yMm: 70, wMm: 80, fontPt: 10, bold: true, align: "right", color: "#222" }),
        makeText({ text: "Bill To:\nClient Name\nDubai, U.A.E", xMm: SIDE, yMm: 84, wMm: 100, fontPt: 10, color: "#222" }),
        makeTable({
          xMm: SIDE, yMm: 104, wMm: W, accent,
          rows: [
            ["Service item 1", "1", "1,000.00", "1,000.00"],
            ["", "", "", ""],
          ],
        }),
        makeText({ text: "Subtotal:  1,000.00\nVAT 5%:  50.00\nTotal:  1,050.00", xMm: 116, yMm: 150, wMm: 70, fontPt: 10, bold: true, align: "right", color: "#222", lineHeight: 1.6 }),
        makeRule({ xMm: 126, yMm: 224, wMm: 60, color: "#888" }),
        makeText({ text: "Full Name", xMm: 126, yMm: 226, wMm: 60, fontPt: 10, bold: true, color: "#222" }),
        makeText({ text: "Authorised Signatory", xMm: 126, yMm: 231, wMm: 60, fontPt: 8.5, color: "#666" }),
      ];
    case "letter":
      return [
        makeText({ text: "Ref:  ____", xMm: SIDE, yMm: 56, wMm: 80, fontPt: 10, color: "#222" }),
        makeText({ text: "Date:  13 / 06 / 2026", xMm: 106, yMm: 56, wMm: 80, fontPt: 10, align: "right", color: "#222" }),
        makeText({ text: "SUBJECT: ____________", xMm: SIDE, yMm: 72, wMm: W, fontPt: 11, bold: true, underline: true, color: accent }),
        makeText({ text: "Dear Sir/Madam,", xMm: SIDE, yMm: 84, wMm: W, fontPt: 10.5, color: "#222" }),
        makeText({
          text: "Body of the letter goes here. Write freely — this block can be moved, resized, duplicated or deleted.",
          xMm: SIDE, yMm: 94, wMm: W, fontPt: 10.5, color: "#222", lineHeight: 1.5,
        }),
        makeText({ text: "Yours sincerely,", xMm: SIDE, yMm: 210, wMm: 80, fontPt: 10.5, color: "#222" }),
        makeText({ text: "Full Name", xMm: SIDE, yMm: 224, wMm: 80, fontPt: 10, bold: true, color: "#222" }),
        makeText({ text: "Designation", xMm: SIDE, yMm: 229, wMm: 80, fontPt: 8.5, color: "#666" }),
      ];
    default:
      return [];
  }
}
