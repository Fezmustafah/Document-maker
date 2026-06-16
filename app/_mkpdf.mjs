import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
const pdf = await PDFDocument.create();
const f = await pdf.embedFont(StandardFonts.Helvetica);
for (const t of ["INVOICE — Page 1", "TERMS — Page 2"]) {
  const p = pdf.addPage([420, 595]);
  p.drawText(t, { x: 40, y: 540, size: 20, font: f, color: rgb(0.1,0.13,0.23) });
  p.drawText("Authorised signatory: ______________", { x: 40, y: 90, size: 11, font: f });
}
const b = await pdf.save();
process.stdout.write(Buffer.from(b).toString("base64"));
