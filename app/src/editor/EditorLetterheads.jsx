// EditorLetterheads — saved letterheads for the editor. Add / select / delete.
// Selecting one sets it as the page background and loads its margins + accent.
import { useEffect, useRef, useState } from "react";
import { downscaleToDataUrl, dominantAccent } from "../lib/image.js";
import { listLetterheads, saveLetterhead, deleteLetterhead } from "../lib/storage.js";

export default function EditorLetterheads({ editor, dispatch }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef(null);

  const refresh = async () => setItems(await listLetterheads());
  useEffect(() => { refresh(); }, []);

  async function add() {
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;
    const dataUrl = await downscaleToDataUrl(file);
    const lh = editor.letterhead;
    // auto-detect the brand accent from the letterhead itself
    const detected = await dominantAccent(dataUrl);
    const rec = await saveLetterhead({
      name: name.trim(), dataUrl,
      marginTop: lh.marginTop, marginBottom: lh.marginBottom, marginSide: lh.marginSide,
      accent: detected || lh.accent,
    });
    setName(""); setAdding(false); if (fileRef.current) fileRef.current.value = "";
    await refresh(); select(rec);
  }

  function select(rec) {
    dispatch({
      type: "SET_LETTERHEAD",
      patch: {
        id: rec.id, name: rec.name, dataUrl: rec.dataUrl,
        marginTop: rec.marginTop ?? 52, marginBottom: rec.marginBottom ?? 26,
        marginSide: rec.marginSide ?? 24, accent: rec.accent ?? "#1A2456",
      },
    });
  }

  async function remove(id, e) {
    e.stopPropagation();
    await deleteLetterhead(id);
    if (editor.letterhead.id === id)
      dispatch({ type: "SET_LETTERHEAD", patch: { id: "", name: "", dataUrl: "" } });
    await refresh();
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((rec) => {
          const active = rec.id === editor.letterhead.id;
          return (
            <button key={rec.id} type="button" onClick={() => select(rec)}
              className={"group relative overflow-hidden rounded border text-left " + (active ? "border-navy ring-2 ring-navy" : "border-hairline hover:border-brass")}>
              <img src={rec.dataUrl} alt={rec.name} className="h-16 w-full object-cover object-top" />
              <span className="block truncate px-1 py-0.5 text-[10px] font-medium text-navy">{rec.name}</span>
              <span role="button" aria-label={`Delete ${rec.name}`} onClick={(e) => remove(rec.id, e)}
                className="absolute right-0.5 top-0.5 rounded bg-white/90 px-1 text-[10px] text-red-600 opacity-0 group-hover:opacity-100">✕</span>
            </button>
          );
        })}
      </div>
      {items.length === 0 && <p className="text-xs text-navy/40">No letterheads yet — add one (it persists).</p>}

      {adding ? (
        <div className="space-y-2 rounded border border-hairline p-2">
          <input className="w-full rounded border border-hairline px-2 py-1 text-sm" placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*" className="text-xs" />
          <div className="flex gap-2">
            <button type="button" onClick={add} className="rounded bg-navy px-2 py-1 text-xs text-paper">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded border border-hairline px-2 py-1 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="rounded border border-navy px-2 py-1 text-xs text-navy hover:bg-navy hover:text-paper">+ Add letterhead</button>
      )}
    </div>
  );
}
