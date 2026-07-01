// invoicePdf.js — single tax-invoice PDF for one delivery (jsPDF).
// The colour SKIN comes from settings.theme (resolveTheme); the structural
// LAYOUT comes from settings.layout (resolveLayout). A4, mm units. The actual
// drawing per layout lives in invoiceLayouts.js.
import { PAGE, newDoc, resolveTheme } from "./pdfShared.js";
import { resolveLayout } from "./constants.js";
import { drawInvoice } from "./invoiceLayouts.js";
import { invoiceNo } from "./format.js";

export function buildInvoice({ order, date, index, settings, sig, letterhead, doc: sharedDoc }) {
  const { seller, buyer, vatRate } = settings;
  const T = resolveTheme(settings, letterhead);
  const useLh = !!(letterhead && letterhead.dataUrl);
  // Shared doc (SoA pack) draws onto the current page so images embed once.
  const doc = sharedDoc || newDoc();
  const ctx = { seller, buyer, order, date, index, vatRate, sig, useLh, letterhead };
  drawInvoice(doc, T, ctx, resolveLayout(settings));
  return doc;
}

export function downloadInvoice(args) {
  const doc = buildInvoice(args);
  doc.save(`${invoiceNo(args.date, args.index)}.pdf`);
}
