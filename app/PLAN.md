# Letterhead Studio — Execution Plan

Planned by Fable 5, 2026-06-13. Execution: hand each phase to an executor model (Sonnet/Opus).
Spec of record: [PROMPT.md](PROMPT.md). If plan and spec conflict, spec wins.

## How to run this plan

Open Claude Code in this folder, pick a non-Fable model, and say:
> "Read PROMPT.md and PLAN.md. Execute Phase N. Do not skip the verification step at the end of the phase."

Do phases in order. Each phase ends with a check the executor must pass before moving on.

---

## Phase 1 — Scaffold (small)
- `npm create vite@latest . -- --template react`, install deps per PROMPT §2.
- Tailwind config + tokens in `index.css` (palette in PROMPT §10).
- Folder skeleton per PROMPT §3 (empty stubs fine).
- ✅ Check: `npm run dev` boots, blank app, zero console errors.

## Phase 2 — Pure libraries (small, testable)
- `src/lib/numberToWords.js` + `tests/numberToWords.test.js` — all six cases in PROMPT §7 pass (use vitest: `npm i -D vitest`, `npx vitest run`).
- `src/lib/storage.js` — idb-keyval wrappers per PROMPT §9.
- `src/lib/image.js` — canvas downscale to ≤1100px JPEG q0.82.
- ✅ Check: `npx vitest run` green.

## Phase 3 — PDF engine (the hard one, do alone)
- `src/lib/pdf.js`: `buildPDF(config)` per PROMPT §8.
- Build with a HARD-CODED sample config first (29-row invoice + a sample letterhead image) — render, download, eyeball.
- Handle the page-break background gotcha (PROMPT §8). Recommended: pre-paginate (chunk rows per page, addPage + background + fresh autotable per chunk) — simpler to reason about than didDrawPage timing.
- Implement invoice/tax-invoice/proforma layout fully here. Quotation = invoice + intro + validity. Letter + Statement come in Phase 6.
- ✅ Check: 30-row invoice fits one page inside safe zone; 60-row case = 2 pages, background on both, table never covered.

## Phase 4 — Form state + UI wiring (large)
- `src/state/useDocState.js` (useReducer).
- Components: DocTypeSelector, PartiesForm, LineItemsTable, FooterForm, MarginSliders, AccentPicker.
- PdfPreview iframe + 350ms debounce + manual Update button.
- Download button.
- Two-column layout per PROMPT §10.
- ✅ Check: type in form → preview updates ≤0.5s; Qty×Unit → Amount; Subtotal/VAT/Total compute; download names file `<Company>_<DocType>.pdf`.

## Phase 5 — Letterhead library + brand kits + presets
- LetterheadLibrary component + IndexedDB persistence + per-letterhead margins/accent (PROMPT §4.1–4.2).
- `src/config/brandKits.js` seeded with both companies (PROMPT §6); editable in-app.
- PresetBar: save/load/delete full form snapshots.
- ✅ Check: add letterhead → hard refresh → still there with its margins/accent. Preset round-trips every field.

## Phase 6 — Statement + Letter modes
- Ledger layout per PROMPT §5 (running balance, reconciliation summary, received vs outstanding NEVER merged).
- Letter mode: subject, salutation, body paragraphs, signature block.
- ✅ Check: switch doc types → correct blocks show/hide; statement math correct.

## Phase 7 — Acceptance + polish
- Run full PROMPT §11 checklist; fix failures.
- README per PROMPT §12.
- `npm run build`, verify `dist/` works (e.g. `npx serve dist`).
- ✅ Check: every §11 box ticked.

## Phase 8 — Go live (when user asks)
- Netlify drag-and-drop of `dist/` (fastest), or GitHub Pages.
- ⚠️ Before any PUBLIC repo push: strip bank/TRN from `brandKits.js` into first-launch IndexedDB seeding (PROMPT §6 warning).

## Phase 9 — Stretch (optional, PROMPT §13)
Stamp/signature PNG → discounts → PNG export → duplicate-document.

---

## Risk notes for the executor
1. **Page-break background** is the #1 known failure. Pre-paginate; verify visually with 60 rows.
2. **Letterheads vary** — that's why margins are per-letterhead, not global. Don't hard-code safe zones.
3. **jsPDF fonts**: built-in Helvetica/Times only unless embedding. Use helvetica for body, times for statement headings. Don't try to load Google fonts in v1.
4. **iframe PDF preview** broken in some browsers — keep Download as the guaranteed path; don't block on preview quirks.
5. Keep `pdf.js` pure: no React imports, no storage calls. Data in → doc out.
