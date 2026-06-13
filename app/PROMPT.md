# Letterhead Studio — Build Spec (PROMPT.md)

> Source of truth for this project. An executor model should build EXACTLY this.
> Planned by Fable 5 on 2026-06-13. See PLAN.md for build order and task breakdown.

## 1. What you are building

A local-first web app that generates print-ready business documents (invoices, tax invoices, quotations, proforma invoices, statements of account, plain letters) by overlaying typed data onto a company letterhead image (JPG/PNG).

The user uploads a blank A4 letterhead once; the app remembers it. They then pick a document type, fill in a form, and the app renders the content inside the letterhead's safe zone — professionally typeset and evenly spaced — with a live PDF preview and a Download PDF button. The output must look like it came from an established firm's finance department: navy/serif corporate, never decorative.

Primary user: an operations manager in Dubai who produces these repeatedly for two companies and occasional others. He often receives blank letterheads on WhatsApp as images. He cares intensely about clean spacing, alignment, and a serious corporate look. No charts, pills, gradients, emoji, or clip-art — ever.

Core workflows:
1. Make professional corporate-style quotation to a company (default template provided).
2. Drop a WhatsApp letterhead image into the tool, add text over it (backup for when Claude chat limits run out).
3. Make invoices from a given template.
4. Plain letter mode (NOC-style / general correspondence) on letterhead.

Elements on the page should be repositionable (margin/offset controls) and removable (toggle blocks off).

## 2. Tech stack (use exactly this unless blocked)

- Vite + React (JavaScript, not TypeScript)
- Tailwind CSS
- jsPDF + jspdf-autotable (npm, not CDN)
- idb-keyval (IndexedDB) for persistence
- No backend. Static build → Netlify / GitHub Pages. Must go live later.

Scaffold:
```bash
npm create vite@latest . -- --template react
npm i jspdf jspdf-autotable idb-keyval
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 3. Folder structure

```
letterhead-studio/
├─ index.html
├─ package.json
├─ tailwind.config.js
├─ PROMPT.md
├─ README.md
├─ public/seed/                # optional seed letterhead images
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx                  # form column + preview column
│  ├─ index.css                # tailwind + base tokens
│  ├─ config/brandKits.js      # two seeded companies (§6)
│  ├─ lib/
│  │  ├─ storage.js            # idb-keyval wrappers
│  │  ├─ numberToWords.js      # AED converter (§7) + tests
│  │  ├─ pdf.js                # buildPDF(config) -> jsPDF doc
│  │  └─ image.js              # downscale uploaded letterhead
│  ├─ components/
│  │  ├─ LetterheadLibrary.jsx
│  │  ├─ DocTypeSelector.jsx
│  │  ├─ PartiesForm.jsx
│  │  ├─ LineItemsTable.jsx
│  │  ├─ FooterForm.jsx
│  │  ├─ MarginSliders.jsx
│  │  ├─ AccentPicker.jsx
│  │  ├─ PresetBar.jsx
│  │  └─ PdfPreview.jsx        # iframe with doc.output('bloburl')
│  └─ state/useDocState.js     # central form state
└─ tests/numberToWords.test.js
```

## 4. Core features (must all work)

1. **Letterhead library.** Grid of saved letterheads (thumbnail + company name). "Add letterhead" dialog: name + image upload. On save: downscale to ≤1100px wide JPEG (~0.82 quality) via `src/lib/image.js`, store in IndexedDB. Selectable cards; delete button; persists across reloads.
2. **Per-letterhead safe-zone defaults.** Each letterhead stores its own `marginTop/marginBottom/marginSide` (mm) and `accent` colour; auto-loads on selection.
3. **Document type selector** — Tax Invoice, Invoice, Quotation, Proforma Invoice, Statement of Account, Letter. Switching toggles optional blocks (quotation/proforma: intro paragraph + validity line; statement: ledger layout; letter: free-form body, subject line, no items table).
4. **Header fields** — doc/ref number, free-text date (`22 / 03 / 2026`), optional sub-title.
5. **Parties** — "Bill To / Addressed To" multi-line; optional Client TRN and Own TRN.
6. **Line-items table** — Description, Qty, Unit price → Amount auto-computed. Add/remove rows. Currency selector (DH / AED / USD / none). Flat-amount-only rows allowed. Subtotal auto-sums. VAT % → VAT amount + Total. Thousands separators, tabular figures.
7. **Amount in words** — from total via `numberToWords.js`. Toggle on/off.
8. **Footer** — multi-line bank details, closing note, signature name + title above a signature rule.
9. **Live preview** — real PDF → blob URL → `<iframe>`. Debounce ~350ms + manual Update button. WYSIWYG.
10. **Download PDF** — `doc.save("<Company>_<DocType>.pdf")`.
11. **Margin sliders** (top/bottom/side, mm) + accent picker — live update, saved back to active letterhead. This is the "move elements" mechanism; block toggles are the "delete elements" mechanism.
12. **Presets** — save entire form (minus letterhead image) under a name; one-click reload; delete; IndexedDB.

## 5. Document layouts (top → bottom)

**Invoice / Tax Invoice / Proforma**
1. Title (centered, accent, bold) + optional sub-title.
2. Left: `NO:`/`REF:` + number. Right: bordered date box.
3. Parties: "Bill To:" + address left; TRNs right-aligned.
4. Line-items table (§8 styling).
5. Totals right-aligned: Subtotal, VAT (only if % > 0), Total in filled accent band, white bold.
6. Amount in words (italic).
7. Bank details (accent heading + lines).
8. Closing note (italic, muted).
9. Signature rule + name (bold) + title (muted), bottom-right.

**Quotation / Proforma** — same, plus intro paragraph after the date row and validity line ("This quotation is valid for 30 days from the date above.") before the signature.

**Letter** — date right, ref left, subject line (bold, underlined), salutation, free-form body paragraphs, closing line, signature block. No table, no totals.

**Statement of Account (ledger mode)** — serif-leaning, restrained:
- FROM / TO block, no boxes.
- Opening balance line.
- Columns: Date, Reference/Description, Debit, Credit, Running Balance.
- Reconciliation summary bottom-right: total received, total outstanding, closing balance in accent band. Dark red ONLY for outstanding/owed figure.
- Footer: "This statement is issued for account reconciliation purposes."
- RULE: never fold advanced-but-unrecovered amounts into "received"; received vs outstanding stay separate.

## 6. Brand kits (`src/config/brandKits.js`, seeded, editable in-app)

⚠️ Bank/TRN values are sensitive — if repo goes public, move them out of source into IndexedDB on first launch (prompt once). Note in README.

**Bait Al Madina – Traditional Kitchen** (food/hospitality)
- Accent navy `#1A2456` (also `#1A3A5C`), gold `#A9853F`.
- Phones: `+971 55 692 5963`, `+971 54 448 6615`.
- Address: `Jebel Ali - 1, Dubai - U.A.E`. Email: `adnankhanbhutta786@gmail.com`.
- TRN: `104213822000003`.
- Bank: `ADCB Islamic Banking` · Account name: `Bait Al Madina Traditional Kitchen` · Account no.: `134121818200` · IBAN: `AE79 0030 0013 4121 8182 00`.
- Signatory: `Mr. Adnan`. Closing line: `Bait Al Madina – Traditional Kitchen` (NOT "For Bait Al Madina").
- Default: Tax Invoice / Quotation. Margins: top 52, bottom 26, side 24 (mm).

**Falcon Horizons Tourism L.L.C** (travel) — note the "S"
- Accent navy `#1F4E8C`, red `#C8332E` (red sparingly).
- Trade License: `1524152`. Signatory: `Mr. Adnan, Chief Executive Officer`, `+971 54 308 8157`.
- Default: Statement of Account / NOC-style letter. Margins: top 48, bottom 24, side 22 (mm).

Shape:
```js
{ id, name, accent, phones:[], address, email, trn,
  bank:{name,accountName,accountNo,iban},
  signatory:{name,title,phone}, closingLine,
  defaults:{docType, mt, mb, ms} }
```

## 7. Number-to-words (`src/lib/numberToWords.js`)

Format: `"<Words> Dirhams[ and <Fils> Fils] Only"`. Singular "Dirham" for exactly 1. Up to billions.

Must-pass tests (`tests/numberToWords.test.js`):
```
429000     -> "Four Hundred Twenty-Nine Thousand Dirhams Only"
20000      -> "Twenty Thousand Dirhams Only"
479587.50  -> "Four Hundred Seventy-Nine Thousand Five Hundred Eighty-Seven Dirhams and Fifty Fils Only"
1          -> "One Dirham Only"
2776       -> "Two Thousand Seven Hundred Seventy-Six Dirhams Only"
14950      -> "Fourteen Thousand Nine Hundred Fifty Dirhams Only"
```

## 8. PDF engine (`src/lib/pdf.js`) — must be exactly right

- A4, mm (210 × 297). `buildPDF(config)` returns jsPDF doc; never saves directly.
- Background: `doc.addImage(letterheadDataUrl, "JPEG", 0, 0, 210, 297)` first, EVERY page.
- Safe zone: content from `marginTop` to `297 - marginBottom`; sides `marginSide`. autotable `margin:{top,bottom,left,right}` must match so pagination respects footer.
- Items table (jspdf-autotable):
  - `theme:"grid"`, `lineWidth ~0.15`, grey grid.
  - Head: `fillColor = accent`, white, bold, centered.
  - `alternateRowStyles.fillColor = [238,242,250]`.
  - Columns: NO. centered ~11mm, Description left flex, Qty right ~22mm, Unit Price right ~28mm, Amount right ~30mm. Numbers right-aligned.
  - Auto-shrink: `>24 rows → 7.4pt`, `>16 → 8pt`, else `8.6pt` (29–30-row invoice fits one page).
- **GOTCHA — page-break background:** `didDrawPage` fires after the table draws; re-adding background there paints over the table. Either draw page-1 background before the table and only re-draw for `pageNumber > 1` with correct timing, or pre-paginate (chunk rows per page: `addPage()` + background + fresh autotable per chunk repeating header). Verify visually.
- Totals, words, bank, note, signature drawn manually (`doc.text`/`doc.rect`) after `doc.lastAutoTable.finalY` with consistent vertical gaps. Clamp signature above footer margin.
- Hex accent → RGB for jsPDF.

## 9. Storage (`src/lib/storage.js`, idb-keyval)

- Letterheads `lh:<id>` → `{id,name,dataUrl,marginTop,marginBottom,marginSide,accent}`.
- Presets `preset:<id>` → full form snapshot + `_name` + items + docType.
- Helpers: `listLetterheads()`, `saveLetterhead()`, `deleteLetterhead()`, ditto presets.
- NEVER localStorage/sessionStorage for images. IndexedDB only.
- First run: seed from `public/seed/` if present and no letterheads exist.

## 10. UI / visual standard

- Two columns: left scrollable form (collapsible numbered sections 1–6); right sticky live preview + margin sliders + accent picker + Download. Single column + sticky bottom bar ≤880px.
- Palette: deep navy `#11203A`, warm paper `#F4F1EA`, brass `#A9853F`, hairline `#E5E0D5`. Georgia serif only for wordmark; system sans elsewhere. Finance utility, not SaaS landing page.
- Accessibility: focus rings, input labels, keyboard-only works, `prefers-reduced-motion`.
- Copy plain, active voice. Empty/error states give direction.

## 11. Acceptance checklist

- [ ] `npm run dev` boots, no console errors.
- [ ] Add letterhead → persists after hard refresh.
- [ ] Selecting letterhead loads its margins + accent.
- [ ] 30-row tax invoice on one A4 page inside safe zone, letterhead header/footer clear.
- [ ] Qty × Unit auto-fills Amount; Subtotal/VAT/Total compute; words match §7.
- [ ] Total in accent band; numbers right-aligned; no footer overlap.
- [ ] Quotation shows intro + validity; Statement shows ledger + running balance; Letter shows free-form layout.
- [ ] Preview updates ≤0.5s; Download names PDF correctly.
- [ ] Preset save → reload page → load → every field returns.
- [ ] 60-row case keeps background on every page, never paints over table.
- [ ] `npm run build` static bundle runs from `dist/`.

## 12. README must include

- Run/build/deploy (Netlify drag-drop of `dist/`, GitHub Pages).
- "How to add a company."
- Bank/TRN public-repo warning.
- Known limits: device-local storage; preview varies by browser, Download always works.

## 13. Stretch goals (only after §11 passes)

1. Stamp/signature transparent-PNG upload, position + size adjustable.
2. Per-line discount column + discount total.
3. Export first page to PNG.
4. Duplicate-document action (clone preset, bump number/date).
5. storage.js structured so IndexedDB could later swap for an API (cloud sync v2).

## 14. Build order

1. Scaffold Vite/React/Tailwind; tokens in `index.css`.
2. `numberToWords.js` + passing tests.
3. `storage.js` + `image.js`.
4. `pdf.js` — hard-coded sample invoice on letterhead first; nail safe zone + table + totals + page-break gotcha.
5. Form state + components → `buildPDF`.
6. Live preview iframe + debounce.
7. Letterhead library + per-letterhead margins/accent.
8. Presets.
9. Statement/ledger mode + Letter mode.
10. Acceptance checklist; fix; stretch goals.

Keep components small; PDF engine pure (data in → doc out).
