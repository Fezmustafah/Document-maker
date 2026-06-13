import { useEffect, useRef, useState } from "react";
import { useEditor } from "./editor/useEditor.js";
import { makeText, makeRule, makeTable, TEMPLATE_LIST, A4, PXPM } from "./editor/model.js";
import { exportEditorPdf } from "./lib/exportPdf.js";
import { saveLetterhead } from "./lib/storage.js";
import Canvas from "./editor/Canvas.jsx";
import Inspector from "./editor/Inspector.jsx";
import EditorLetterheads from "./editor/EditorLetterheads.jsx";
import EditorPresets from "./editor/EditorPresets.jsx";
import StampStudio from "./editor/StampStudio.jsx";
import AiPanel from "./editor/AiPanel.jsx";
import MobileShell from "./editor/MobileShell.jsx";
import Tutorial, { seenOnboarding } from "./editor/Tutorial.jsx";
import { useViewport } from "./editor/useViewport.js";
import AuthBar from "./auth/AuthBar.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";

function Panel({ title, children, right, accent }) {
  return (
    <section className={"rounded-xl border bg-white p-3.5 shadow-card " + (accent ? "border-brass/40 ring-1 ring-brass/10" : "border-hairline")}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className={"label " + (accent ? "text-brass" : "text-navy/55")}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8">
      <rect width="64" height="64" rx="14" fill="#11203A" />
      <rect x="18" y="13" width="28" height="38" rx="3" fill="#F4F1EA" />
      <rect x="18" y="13" width="28" height="8" rx="3" fill="#A9853F" />
      <rect x="23" y="28" width="18" height="2.6" rx="1.3" fill="#11203A" />
      <rect x="23" y="34" width="18" height="2.6" rx="1.3" fill="#11203A" />
      <rect x="23" y="40" width="11" height="2.6" rx="1.3" fill="#A9853F" />
    </svg>
  );
}

export default function App() {
  const [editor, dispatch] = useEditor();
  const [stampOpen, setStampOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => !seenOnboarding());
  const auth = useAuth();
  const storeKey = (auth?.user?.id || "local") + ":" + refreshKey;
  const lh = editor.letterhead;
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!lh.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveLetterhead({
        id: lh.id, name: lh.name, dataUrl: lh.dataUrl,
        marginTop: lh.marginTop, marginBottom: lh.marginBottom, marginSide: lh.marginSide, accent: lh.accent,
      });
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [lh.id, lh.marginTop, lh.marginBottom, lh.marginSide, lh.accent, lh.name, lh.dataUrl]);

  const setLh = (patch) => dispatch({ type: "SET_LETTERHEAD", patch });

  const addText = () => dispatch({ type: "ADD", element: makeText({ xMm: lh.marginSide, yMm: lh.marginTop + 8, wMm: A4.wMm - lh.marginSide * 2, text: "New text block", color: "#222" }) });
  const addLine = () => dispatch({ type: "ADD", element: makeRule({ xMm: lh.marginSide, yMm: lh.marginTop + 30, wMm: 80 }) });
  const addTable = () => dispatch({ type: "ADD", element: makeTable({ xMm: lh.marginSide, yMm: lh.marginTop + 40, wMm: A4.wMm - lh.marginSide * 2, accent: lh.accent }) });

  function loadTemplate(id) {
    if (editor.elements.length && !window.confirm("Replace the current layout with the " + id + " template?")) return;
    dispatch({ type: "LOAD_TEMPLATE", id });
  }
  function download() {
    const doc = exportEditorPdf(editor);
    doc.save(`${(lh.name || "Document").replace(/\s+/g, "_")}.pdf`);
  }
  function preview() {
    window.open(exportEditorPdf(editor).output("bloburl"), "_blank");
  }
  function clearLayout() {
    if (!editor.elements.length || window.confirm("Clear all blocks and start a blank page?")) {
      dispatch({ type: "CLEAR" });
    }
  }

  const vp = useViewport();

  // shared margin + accent controls (used by desktop sidebar AND mobile sheet)
  const MarginControls = () => (
    <div className="space-y-2">
      <Slider label="Header zone" value={lh.marginTop} min={10} max={120} onChange={(v) => setLh({ marginTop: v })} />
      <Slider label="Footer zone" value={lh.marginBottom} min={10} max={80} onChange={(v) => setLh({ marginBottom: v })} />
      <Slider label="Side" value={lh.marginSide} min={8} max={40} onChange={(v) => setLh({ marginSide: v })} />
    </div>
  );
  const AccentInput = () => (
    <label className="flex items-center gap-2 text-xs text-navy/60">
      <span className="w-16 font-semibold uppercase tracking-wide">Accent</span>
      <input type="color" value={lh.accent} onChange={(e) => setLh({ accent: e.target.value })} className="h-6 w-9 rounded border border-hairline" />
      <span className="tabular-nums">{lh.accent}</span>
    </label>
  );

  if (vp.isMobile) {
    return (
      <>
        <MobileShell
          editor={editor} dispatch={dispatch}
          AiPanel={AiPanel} Inspector={Inspector}
          EditorLetterheads={EditorLetterheads} EditorPresets={EditorPresets}
          AuthBar={AuthBar} onAuthChange={() => setRefreshKey((k) => k + 1)}
          onSignup={() => setShowTutorial(true)} onHelp={() => setShowTutorial(true)}
          storeKey={storeKey}
          onPreview={preview} onDownload={download} onClear={clearLayout}
          onAddText={addText} onAddTable={addTable} onAddLine={addLine}
          onOpenStamp={() => setStampOpen(true)}
          onLoadTemplate={loadTemplate} templates={TEMPLATE_LIST}
          MarginControls={MarginControls} AccentInput={AccentInput}
        />
        {stampOpen && <StampStudio editor={editor} dispatch={dispatch} onClose={() => setStampOpen(false)} />}
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="glass flex items-center justify-between border-b border-hairline px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <h1 className="font-display text-[17px] font-extrabold leading-none tracking-tightest text-navy">Letterhead Studio</h1>
            <p className="mt-0.5 text-[11px] text-navy/45">Describe it, or drop blocks — on your own letterhead.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTutorial(true)} title="How it works"
            className="grid h-7 w-7 place-items-center rounded-full border border-hairline text-sm font-semibold text-navy/60 hover:border-brass hover:text-navy">?</button>
          <AuthBar onAuthChange={() => setRefreshKey((k) => k + 1)} onSignup={() => setShowTutorial(true)} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---- left: editing tools ---- */}
        <aside className="w-[300px] shrink-0 space-y-3 overflow-auto border-r border-hairline bg-white/40 p-3">
          {editor.selectedId && (
            <Panel title="Selected block" accent>
              <Inspector editor={editor} dispatch={dispatch} />
            </Panel>
          )}

          <Panel title="✦ Write with AI" accent>
            <AiPanel editor={editor} dispatch={dispatch} />
          </Panel>

          <Panel title="Choose what it is">
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_LIST.map((t) => (
                <button key={t.id} onClick={() => loadTemplate(t.id)} className="rounded border border-hairline px-2.5 py-1 text-xs text-navy hover:border-brass">{t.label}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Add block">
            <div className="flex flex-wrap gap-2">
              <button onClick={addText} className="rounded border border-navy px-2.5 py-1 text-xs text-navy hover:bg-navy hover:text-paper">+ Text</button>
              <button onClick={addTable} className="rounded border border-navy px-2.5 py-1 text-xs text-navy hover:bg-navy hover:text-paper">+ Table</button>
              <button onClick={addLine} className="rounded border border-navy px-2.5 py-1 text-xs text-navy hover:bg-navy hover:text-paper">+ Line</button>
              <button onClick={() => setStampOpen(true)} className="rounded border border-brass bg-brass/10 px-2.5 py-1 text-xs text-navy hover:bg-brass hover:text-white">+ Sign / Stamp</button>
            </div>
          </Panel>

          <Panel title="Letterhead" right={
            <label className="flex items-center gap-1 text-[10px] text-navy/60">
              <input type="checkbox" checked={editor.showGuides} onChange={() => dispatch({ type: "TOGGLE_GUIDES" })} /> guides
            </label>
          }>
            <EditorLetterheads key={"lh:" + storeKey} editor={editor} dispatch={dispatch} />
            <div className="mt-3 space-y-2 border-t border-hairline pt-2">
              <Slider label="Header zone" value={lh.marginTop} min={10} max={120} onChange={(v) => setLh({ marginTop: v })} />
              <Slider label="Footer zone" value={lh.marginBottom} min={10} max={80} onChange={(v) => setLh({ marginBottom: v })} />
              <Slider label="Side" value={lh.marginSide} min={8} max={40} onChange={(v) => setLh({ marginSide: v })} />
              <label className="flex items-center gap-2 text-xs text-navy/60">
                <span className="w-16 font-semibold uppercase tracking-wide">Accent</span>
                <input type="color" value={lh.accent} onChange={(e) => setLh({ accent: e.target.value })} className="h-6 w-9 rounded border border-hairline" />
                <span className="tabular-nums">{lh.accent}</span>
              </label>
            </div>
          </Panel>

          <Panel title="Saved layouts">
            <EditorPresets key={"pr:" + storeKey} editor={editor} dispatch={dispatch} />
          </Panel>
        </aside>

        {/* ---- center: canvas (scales to fill the workspace) ---- */}
        <FitCanvas editor={editor} dispatch={dispatch} />

        {/* ---- right: document / export ---- */}
        <aside className="w-[280px] shrink-0 space-y-3 overflow-auto border-l border-hairline bg-white/40 p-3">
          <Panel title="Document">
            <label className="block text-xs text-navy/60">
              <span className="font-semibold uppercase tracking-wide">File name</span>
              <input
                value={lh.name}
                onChange={(e) => setLh({ name: e.target.value })}
                placeholder="Document"
                className="mt-1 w-full rounded border border-hairline px-2 py-1.5 text-sm text-navy outline-none focus:border-brass"
              />
            </label>
            <div className="mt-3 space-y-2">
              <button onClick={download} className="btn-primary w-full justify-center">Download PDF</button>
              <button onClick={preview} className="btn-ghost w-full justify-center">Preview PDF</button>
            </div>
            <p className="mt-2 text-[11px] text-navy/40">Exports a print-ready A4 PDF on your letterhead.</p>
          </Panel>

          <Panel title="Layout">
            <div className="flex items-center justify-between text-xs text-navy/55">
              <span>{editor.elements.length} block{editor.elements.length === 1 ? "" : "s"} on the page</span>
            </div>
            <button
              onClick={clearLayout}
              className="mt-3 w-full rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Clear page
            </button>
          </Panel>
        </aside>
      </div>

      {stampOpen && <StampStudio editor={editor} dispatch={dispatch} onClose={() => setStampOpen(false)} />}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

// Center workspace that scales the A4 page to fill the available room, so the
// editor feels large instead of a small sheet floating in dead space.
function FitCanvas({ editor, dispatch }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const W = A4.wMm * PXPM;
    function recalc() {
      const el = ref.current;
      if (!el || !el.clientWidth) return;
      // fill the workspace width so the page is large; user scrolls vertically.
      const s = (el.clientWidth - 56) / W;
      setScale(Math.max(0.6, Math.min(1.7, s)));
    }
    recalc();
    // a couple of deferred passes catch the first paint before flex settles
    const raf = requestAnimationFrame(recalc);
    const t = setTimeout(recalc, 120);
    const ro = new ResizeObserver(recalc);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", recalc);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); ro.disconnect(); window.removeEventListener("resize", recalc); };
  }, []);
  return (
    <div
      ref={ref}
      className="flex flex-1 items-start justify-center overflow-auto p-7"
      style={{ background: "radial-gradient(1100px 600px at 50% -8%, rgba(169,133,63,0.08), transparent 60%), #e8e4dc" }}
    >
      <Canvas editor={editor} dispatch={dispatch} scale={scale} />
    </div>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <label className="block text-xs text-navy/60">
      <span className="flex justify-between">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        <span className="tabular-nums text-navy">{value} mm</span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brass" />
    </label>
  );
}
