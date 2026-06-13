// Tutorial — 4-step onboarding overlay shown on first visit and right after
// sign-up. Plain steps, no jargon. Persists "seen" in localStorage.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const ONBOARD_KEY = "ls_onboarded_v1";
export const seenOnboarding = () => {
  try { return localStorage.getItem(ONBOARD_KEY) === "1"; } catch { return false; }
};
export const markOnboarded = () => {
  try { localStorage.setItem(ONBOARD_KEY, "1"); } catch { /* ignore */ }
};

const STEPS = [
  {
    n: 1,
    title: "Add your letterhead",
    body: "Upload your company's blank letterhead — the same JPG or PNG your designer or WhatsApp sends. It becomes the paper every document is printed on.",
    art: (
      <g>
        <rect x="26" y="14" width="68" height="92" rx="5" fill="#F4F1EA" stroke="#A9853F" strokeWidth="2" />
        <rect x="26" y="14" width="68" height="18" rx="5" fill="#11203A" />
        <rect x="34" y="20" width="34" height="3" rx="1.5" fill="#A9853F" />
        <path d="M60 52v30M45 67h30" stroke="#A9853F" strokeWidth="4" strokeLinecap="round" />
      </g>
    ),
  },
  {
    n: 2,
    title: "Adjust the canvas",
    body: "Set the safe zone: slide the Header, Footer and Side guides so your text never sits on top of your logo or footer. You only do this once — it's remembered.",
    art: (
      <g>
        <rect x="26" y="14" width="68" height="92" rx="5" fill="#fff" stroke="#E4DECF" strokeWidth="2" />
        <rect x="26" y="14" width="68" height="20" fill="#11203A" opacity="0.08" />
        <rect x="26" y="92" width="68" height="14" fill="#11203A" opacity="0.08" />
        <line x1="26" y1="34" x2="94" y2="34" stroke="#A9853F" strokeWidth="2" strokeDasharray="4 3" />
        <line x1="26" y1="92" x2="94" y2="92" stroke="#A9853F" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="94" cy="34" r="4" fill="#A9853F" />
        <circle cx="26" cy="92" r="4" fill="#A9853F" />
      </g>
    ),
  },
  {
    n: 3,
    title: "Choose what it is",
    body: "Pick the document type — Quotation, Invoice or Letter (or start Blank). This drops in the right structure so the AI knows what to write.",
    art: (
      <g>
        {["Quotation", "Invoice", "Letter"].map((t, i) => (
          <g key={t} transform={`translate(24, ${20 + i * 26})`}>
            <rect width="72" height="20" rx="6" fill={i === 0 ? "#11203A" : "#fff"} stroke="#A9853F" strokeWidth={i === 0 ? 0 : 1.5} />
            <text x="36" y="14" textAnchor="middle" fontSize="9" fontFamily="sans-serif" fill={i === 0 ? "#F4F1EA" : "#11203A"}>{t}</text>
          </g>
        ))}
      </g>
    ),
  },
  {
    n: 4,
    title: "Write the prompt",
    body: 'Tell the AI what you need in plain words — "quotation, 2,500 meal boxes at 10.75, valid 30 days." It writes the wording, builds the table and does the totals, laid out on your letterhead.',
    art: (
      <g>
        <rect x="20" y="34" width="80" height="52" rx="8" fill="#fff" stroke="#E4DECF" strokeWidth="2" />
        <text x="28" y="52" fontSize="7.5" fontFamily="monospace" fill="#11203A">quotation, 2,500</text>
        <text x="28" y="63" fontSize="7.5" fontFamily="monospace" fill="#11203A">meal boxes at</text>
        <text x="28" y="74" fontSize="7.5" fontFamily="monospace" fill="#11203A">10.75…</text>
        <circle cx="60" cy="20" r="11" fill="#A9853F" />
        <path d="M60 15l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#fff" />
      </g>
    ),
  },
];

export default function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" && !last) setI((v) => v + 1);
      if (e.key === "ArrowLeft" && i > 0) setI((v) => v - 1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  });

  function finish() { markOnboarded(); onClose?.(); }

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-navy/55 p-4 backdrop-blur-sm"
      style={{ animation: "lhFade .15s ease-out" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Getting started"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl"
        style={{ animation: "lhPop .2s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="label text-brass">Getting started · {step.n} of {STEPS.length}</span>
          <button onClick={finish} className="text-xs text-navy/45 hover:text-navy">Skip</button>
        </div>

        <div className="flex flex-col items-center gap-5 px-6 py-6 sm:flex-row sm:items-start sm:gap-7">
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-paper ring-1 ring-hairline">
            <svg viewBox="0 0 120 120" className="h-24 w-24">{step.art}</svg>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-sm font-bold text-brass">{step.n}</span>
              <h2 className="font-display text-xl font-extrabold tracking-tightest text-navy">{step.title}</h2>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-navy/65">{step.body}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-hairline px-6 py-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, k) => (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-label={`Step ${k + 1}`}
                className={"h-2 rounded-full transition-all " + (k === i ? "w-6 bg-brass" : "w-2 bg-hairline hover:bg-navy/20")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => setI((v) => v - 1)} className="rounded-lg border border-hairline px-3 py-2 text-sm font-semibold text-navy hover:border-brass">Back</button>
            )}
            {last ? (
              <button onClick={finish} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy/90">Start building →</button>
            ) : (
              <button onClick={() => setI((v) => v + 1)} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy/90">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
