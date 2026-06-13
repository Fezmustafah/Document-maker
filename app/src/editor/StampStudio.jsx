// StampStudio — upload a signature/stamp photo, auto-blend into 3 transparent
// variants, preview them, pick one, drop it on the page.
import { useState } from "react";
import { blendVariants } from "../lib/blend.js";
import { makeImage } from "./model.js";

const CHECKER =
  "repeating-conic-gradient(#d8d4cc 0% 25%, #f4f1ea 0% 50%) 50% / 16px 16px";

const SIZES = [
  { key: "sign", label: "Signature", wMm: 45 },
  { key: "stamp", label: "Stamp", wMm: 38 },
];

export default function StampStudio({ editor, dispatch, onClose }) {
  const [busy, setBusy] = useState(false);
  const [aspect, setAspect] = useState(0.5);
  const [variants, setVariants] = useState([]);
  const [picked, setPicked] = useState("ink");
  const [size, setSize] = useState("sign");
  const [err, setErr] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
      const out = await blendVariants(dataUrl);
      setAspect(out.aspect);
      setVariants(out.variants);
      setPicked(out.variants[0].key);
    } catch (e2) {
      setErr("Could not process that image. Try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  function add() {
    const v = variants.find((x) => x.key === picked);
    if (!v) return;
    const lh = editor.letterhead;
    const sizeDef = SIZES.find((s) => s.key === size);
    dispatch({
      type: "ADD",
      element: makeImage({
        dataUrl: v.dataUrl,
        aspect,
        wMm: sizeDef.wMm,
        xMm: lh.marginSide + 100,
        yMm: 215,
        label: sizeDef.label,
      }),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-hairline bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-wordmark text-lg text-navy">Add signature / stamp</h2>
          <button onClick={onClose} className="text-navy/50 hover:text-navy" aria-label="Close">✕</button>
        </div>

        <p className="mb-3 text-sm text-navy/60">
          Upload a photo or scan (ink on white paper works best). It's auto-blended so the
          white background disappears. Pick the cleanest of the three.
        </p>

        <input type="file" accept="image/*" onChange={onFile} className="mb-4 text-sm" />
        {busy && <p className="text-sm text-navy/50">Blending…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        {variants.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {variants.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setPicked(v.key)}
                  className={"rounded border p-1 text-left " + (picked === v.key ? "border-navy ring-2 ring-navy" : "border-hairline hover:border-brass")}
                >
                  <div className="flex h-28 items-center justify-center rounded" style={{ background: CHECKER }}>
                    <img src={v.dataUrl} alt={v.label} className="max-h-24 max-w-full object-contain" />
                  </div>
                  <span className="mt-1 block text-center text-xs font-medium text-navy">{v.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-navy/60">Place as</span>
                {SIZES.map((s) => (
                  <button key={s.key} onClick={() => setSize(s.key)}
                    className={"rounded border px-2.5 py-1 text-xs " + (size === s.key ? "border-navy bg-navy text-paper" : "border-hairline text-navy hover:border-brass")}>
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={add} className="rounded bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy/90">
                Add to page
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
