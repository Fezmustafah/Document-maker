// Canvas — the A4 page. Letterhead image as background, faint header/footer/side
// guides marking the safe middle zone, and every element on top.
import { A4, PXPM } from "./model.js";
import ElementBox from "./ElementBox.jsx";

export default function Canvas({ editor, dispatch }) {
  const { letterhead, elements, selectedId, showGuides } = editor;
  const W = A4.wMm * PXPM;
  const H = A4.hMm * PXPM;
  const mt = letterhead.marginTop * PXPM;
  const mb = (A4.hMm - letterhead.marginBottom) * PXPM;
  const ms = letterhead.marginSide * PXPM;

  return (
    <div
      onPointerDown={() => dispatch({ type: "SELECT", id: null })}
      className="relative shadow-lg"
      style={{
        width: W,
        height: H,
        background: letterhead.dataUrl ? `#fff url(${letterhead.dataUrl}) center/cover no-repeat` : "#fff",
      }}
    >
      {!letterhead.dataUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-navy/30">
          No letterhead selected — add one in the panel →
        </div>
      )}

      {showGuides && (
        <>
          {/* header / footer reserved zones (printed letterhead area) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-[#A9853F]/60 bg-[#A9853F]/5" style={{ height: mt }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-[#A9853F]/60 bg-[#A9853F]/5" style={{ top: mb }} />
          {/* side margins */}
          <div className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-[#1A2456]/20" style={{ left: ms }} />
          <div className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-[#1A2456]/20" style={{ right: ms }} />
        </>
      )}

      {elements.map((el) => (
        <ElementBox key={el.id} el={el} selected={el.id === selectedId} dispatch={dispatch} />
      ))}
    </div>
  );
}
