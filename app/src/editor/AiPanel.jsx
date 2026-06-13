// AiPanel — describe a document in plain words; AI writes it and places editable
// blocks on the letterhead. Requires sign-in; consumes one credit per success
// from the user's 5-free starter quota.
import { useEffect, useRef, useState } from "react";
import { generateDocument, aiBlocksToElements } from "../lib/aiClient.js";
import { getQuota, consumeAiCredit } from "../lib/quota.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { TEMPLATE_LIST } from "./model.js";

const TYPES = TEMPLATE_LIST.filter((t) => t.id !== "blank");
const SpeechRec =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function AiPanel({ editor, dispatch }) {
  const auth = useAuth();
  const signedIn = !!auth?.user;
  const [brief, setBrief] = useState("");
  const [docType, setDocType] = useState("quotation");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [listening, setListening] = useState(false);
  const [quota, setQuota] = useState(null);
  const recRef = useRef(null);

  useEffect(() => {
    if (!signedIn) { setQuota(null); return; }
    getQuota().then(setQuota);
  }, [signedIn, auth?.user?.id]);

  function toggleMic() {
    if (!SpeechRec) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SpeechRec();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    let base = brief ? brief + " " : "";
    rec.onresult = (e) => {
      let finalT = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalT += t;
        else interim += t;
      }
      if (finalT) base = base + finalT + " ";
      setBrief((base + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  }

  async function run(mode) {
    if (!signedIn) { setErr("Sign in to use AI. It's free — you get 5 generations to start."); return; }
    if (!brief.trim()) { setErr("Describe what to write first."); return; }
    if (quota && quota.free_left <= 0) {
      setErr("You've used your 5 free AI documents. Upgrade soon for more — keep editing by hand anytime.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      // consume the credit FIRST (atomic). If it returns null, we're out.
      const after = await consumeAiCredit();
      if (!after) {
        setQuota({ free_left: 0, used: quota?.used ?? 0 });
        setErr("You've used your 5 free AI documents. Upgrade for more.");
        return;
      }
      setQuota(after);
      const ai = await generateDocument({ brief, docType, company: editor.letterhead.name });
      const els = aiBlocksToElements(ai, editor.letterhead);
      if (mode === "replace") dispatch({ type: "SET_ELEMENTS", elements: els });
      else dispatch({ type: "SET_ELEMENTS", elements: [...editor.elements, ...els] });
    } catch (e) {
      setErr(e.message || "Could not generate.");
    } finally {
      setBusy(false);
    }
  }

  const out = quota && quota.free_left <= 0;

  return (
    <div className="space-y-2">
      {signedIn && quota && (
        <div className={"flex items-center justify-between rounded-md px-2 py-1 text-[11px] " + (out ? "bg-red-50 text-red-700" : "bg-brass/10 text-navy/70")}>
          <span>Free AI documents</span>
          <span className="font-semibold tabular-nums">{quota.free_left} / 5 left</span>
        </div>
      )}
      {!signedIn && (
        <div className="rounded-md bg-navy/5 px-2 py-1.5 text-[11px] text-navy/65">
          <strong className="text-navy">Sign in</strong> to use AI — 5 free generations on every new account.
        </div>
      )}

      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="w-full rounded border border-hairline bg-white px-2 py-1.5 text-sm text-navy"
      >
        {TYPES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>

      <div className="relative">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={5}
          placeholder={"Describe it in your own words, e.g.\nquotation to a client for 500 meal boxes at 12 AED, delivered daily for 30 days, valid 30 days, signed by the manager"}
          className="w-full resize-y rounded border border-hairline bg-white px-2 py-1.5 pr-9 text-sm text-navy outline-none focus:border-brass"
        />
        {SpeechRec && (
          <button
            type="button"
            onClick={toggleMic}
            title={listening ? "Stop dictation" : "Speak instead of typing"}
            aria-label="Voice input"
            className={
              "absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-sm " +
              (listening ? "animate-pulse bg-red-600 text-white" : "bg-navy/5 text-navy hover:bg-navy/10")
            }
          >
            {listening ? "■" : "🎤"}
          </button>
        )}
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => run("replace")}
          disabled={busy || out}
          className="flex-1 rounded bg-brass px-3 py-2 text-sm font-semibold text-white hover:bg-brass/90 disabled:opacity-50"
        >
          {busy ? "Writing…" : "Generate"}
        </button>
        <button
          onClick={() => run("append")}
          disabled={busy || out}
          title="Add to the current page instead of replacing"
          className="rounded border border-navy px-3 py-2 text-sm text-navy hover:bg-navy hover:text-paper disabled:opacity-50"
        >
          + Add
        </button>
      </div>
      <p className="text-[11px] text-navy/40">
        AI writes the wording; every block stays editable. It never adds a header/footer —
        that's your letterhead.
      </p>
    </div>
  );
}
