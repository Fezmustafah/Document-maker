// EditorPresets — save / load / delete a layout (elements + margins + accent).
// The letterhead image itself is not stored in the preset (pick it separately).
import { useEffect, useState } from "react";
import { listPresets, savePreset, deletePreset } from "../lib/storage.js";

export default function EditorPresets({ editor, dispatch }) {
  const [presets, setPresets] = useState([]);
  const [name, setName] = useState("");

  const refresh = async () => setPresets(await listPresets());
  useEffect(() => { refresh(); }, []);

  async function save() {
    if (!name.trim()) return;
    const { marginTop, marginBottom, marginSide, accent } = editor.letterhead;
    await savePreset({
      _name: name.trim(),
      _kind: "editor",
      elements: editor.elements,
      meta: { marginTop, marginBottom, marginSide, accent },
    });
    setName(""); await refresh();
  }

  function load(p) {
    if (!p.elements) return;
    dispatch({ type: "SET_ELEMENTS", elements: p.elements });
    if (p.meta) dispatch({ type: "SET_LETTERHEAD", patch: p.meta });
  }

  async function remove(id) { await deletePreset(id); await refresh(); }

  const editorPresets = presets.filter((p) => p._kind === "editor");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="flex-1 rounded border border-hairline px-2 py-1 text-sm" placeholder="Layout name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="button" onClick={save} className="rounded bg-navy px-2 py-1 text-xs text-paper">Save</button>
      </div>
      {editorPresets.length > 0 && (
        <ul className="divide-y divide-hairline rounded border border-hairline">
          {editorPresets.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-2 py-1 text-sm">
              <button type="button" onClick={() => load(p)} className="text-navy hover:text-brass">{p._name}</button>
              <button type="button" onClick={() => remove(p.id)} className="text-red-600/70 hover:text-red-600" aria-label={`Delete ${p._name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
