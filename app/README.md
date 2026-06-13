# Letterhead Studio

Local-first web app that overlays typed data onto a company letterhead image (JPG/PNG)
and produces print-ready PDFs: invoices, tax invoices, quotations, proforma invoices,
statements of account, and plain letters. Everything runs in the browser — no backend,
no account, no upload to a server. Your letterheads and presets live in the browser's
IndexedDB on your device.

See [PROMPT.md](PROMPT.md) for the full spec and [PLAN.md](PLAN.md) for the build phases.

## Run / build / deploy

```bash
npm install        # one time
npm run dev        # local dev server (http://localhost:5173)
npm test           # number-to-words unit tests (vitest)
npm run build      # static bundle -> dist/
npm run preview    # serve the production build locally
```

### Deploy (static — pick one)

- **Netlify (fastest):** run `npm run build`, then drag-and-drop the `dist/` folder onto
  https://app.netlify.com/drop. Done.
- **GitHub Pages:** push the repo, build, and publish `dist/`. `vite.config.js` already sets
  `base: "./"` so it works from a project sub-path. (Use any Pages action that deploys `dist/`.)

## How to add a company

1. Open section **1 — Letterhead & document type**.
2. Click **+ Add letterhead**, type the company name, choose the blank letterhead image
   (a JPG/PNG, e.g. the one you got on WhatsApp), **Save letterhead**.
3. The image is downscaled and stored locally. Select its card to make it the active background.
4. Drag the **margin sliders** (top / bottom / side) until the content sits cleanly inside the
   letterhead — clear of the printed header and footer. Pick the **accent** colour.
   These margins + accent are remembered **per letterhead**, so you only set them once.
5. Optionally click an **Apply company defaults** button to pre-fill TRN, bank details,
   and signatory for the two seeded companies.

Recurring document? Fill it once, then **section 6 — Presets → Save preset**. Next month,
load the preset, change the number and date, Download.

## Security note — bank / TRN in a public repo

`src/config/brandKits.js` ships with real bank account numbers, IBANs, and TRNs for the two
seeded companies. That is fine for private/local use. **Before pushing this repo to a public
GitHub**, move those sensitive values out of source and seed them into IndexedDB on first
launch instead — do not commit them. (Deploying the built `dist/` to Netlify does not expose
the source, but a public source repo would.)

## Known limits

- **Device-local storage.** Letterheads and presets are saved in this browser's IndexedDB.
  They do not sync across devices or browsers. Clearing site data removes them.
- **Embedded PDF preview varies by browser.** The live preview uses the browser's built-in
  PDF viewer; some browsers render it differently or show a download prompt. The **Download PDF**
  button always produces the correct file regardless.
- **Letterheads differ.** Safe-zone margins are stored per letterhead, not globally — set them
  once per company.

## Project layout

```
src/
  lib/        numberToWords.js · pdf.js (engine) · storage.js · image.js · mapConfig.js
  components/ form sections + PdfPreview (iframe, debounced)
  config/     brandKits.js (seeded companies)
  state/      useDocState.js (useReducer)
tests/        numberToWords.test.js
```

The PDF engine (`src/lib/pdf.js`) is pure: config in → jsPDF doc out. No React, no storage.
