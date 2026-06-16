// pdfSign.js — render an uploaded PDF to page images (pdfjs) and stamp saved
// signatures/stamps back onto the ORIGINAL pdf bytes (pdf-lib), preserving the
// source quality. Placements are stored as page-fractions so display and export
// share one coordinate model.
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Render every page to a JPEG data URL + capture its native point size (for
// export math). renderScale trades crispness for memory.
export async function renderPdf(arrayBuffer, renderScale = 1.6) {
  // pdfjs transfers/detaches the buffer — keep a pristine copy for pdf-lib export.
  const bytes = new Uint8Array(arrayBuffer.slice(0));
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 }); // 1 unit = 1 PDF point
    const vp = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    pages.push({
      dataUrl: canvas.toDataURL("image/jpeg", 0.82),
      wPt: base.width,
      hPt: base.height,
      aspect: base.height / base.width,
    });
  }
  return { pages, bytes, numPages: doc.numPages };
}

function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.split(",")[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// placements: [{ pageIndex, xFrac, yFrac, wFrac, aspect, dataUrl(PNG) }]
export async function exportSignedPdf(originalBytes, placements) {
  const pdf = await PDFDocument.load(originalBytes);
  const pages = pdf.getPages();
  // cache embedded images by dataUrl so the same signature isn't embedded twice
  const cache = new Map();

  for (const p of placements) {
    const page = pages[p.pageIndex];
    if (!page) continue;
    let img = cache.get(p.dataUrl);
    if (!img) { img = await pdf.embedPng(dataUrlToBytes(p.dataUrl)); cache.set(p.dataUrl, img); }
    const { width: Wpt, height: Hpt } = page.getSize();
    const drawW = p.wFrac * Wpt;
    const drawH = drawW * p.aspect;
    const x = p.xFrac * Wpt;
    const y = Hpt - p.yFrac * Hpt - drawH; // pdf-lib origin is bottom-left
    page.drawImage(img, { x, y, width: drawW, height: drawH });
  }
  return pdf.save(); // Uint8Array
}

export function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
