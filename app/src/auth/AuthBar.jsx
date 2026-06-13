// AuthBar — header control. Shows Sign in / account state, opens an auth modal,
// and offers a one-time "sync local → cloud" after first sign-in.
import { useState } from "react";
import { useAuth } from "./AuthProvider.jsx";
import { migrateLocalToCloud } from "../lib/storage.js";

export default function AuthBar({ onAuthChange }) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  if (!auth?.cloudEnabled) {
    return <span className="text-[11px] text-navy/40" title="Cloud not configured — saving on this device only">Local mode</span>;
  }

  if (auth.user) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-navy/60">{auth.user.email}</span>
        <SyncButton onDone={onAuthChange} />
        <button
          onClick={async () => { await auth.signOut(); onAuthChange?.(); }}
          className="rounded border border-hairline px-2 py-1 text-navy hover:border-brass"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded border border-navy px-3 py-1.5 text-sm text-navy hover:bg-navy hover:text-paper">
        Sign in
      </button>
      {open && <AuthModal onClose={() => setOpen(true)} onDone={() => { setOpen(false); onAuthChange?.(); }} />}
    </>
  );
}

function SyncButton({ onDone }) {
  const [state, setState] = useState("idle");
  async function run() {
    setState("running");
    const res = await migrateLocalToCloud();
    setState("done");
    onDone?.();
    setTimeout(() => setState("idle"), 2500);
    return res;
  }
  return (
    <button onClick={run} title="Copy letterheads & layouts saved on this device up to your account"
      className="rounded border border-hairline px-2 py-1 text-navy hover:border-brass">
      {state === "running" ? "Syncing…" : state === "done" ? "Synced ✓" : "Sync local → cloud"}
    </button>
  );
}

function AuthModal({ onClose, onDone }) {
  const auth = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fn = mode === "signin" ? auth.signIn : auth.signUp;
    const { data, error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (mode === "signup" && !data.session) {
      setMsg("Check your email to confirm, then sign in.");
      return;
    }
    onDone?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onClose()}>
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-wordmark text-lg text-navy">{mode === "signin" ? "Sign in" : "Create account"}</h2>
          <button onClick={() => onClose()} aria-label="Close" className="text-navy/50 hover:text-navy">✕</button>
        </div>
        <button
          type="button"
          onClick={() => auth.signInWithGoogle()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded border border-hairline bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-brass"
        >
          <svg viewBox="0 0 18 18" className="h-4 w-4"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.79 2.71v2.26h2.9c1.7-1.56 2.68-3.87 2.68-6.61z"/><path fill="#34A853" d="M9 18c2.43 0 4.46-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.9v2.33A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.71V4.96H.9A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.9 4.96L3.97 7.3C4.68 5.18 6.66 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-navy/40">
          <span className="h-px flex-1 bg-hairline" /> or email <span className="h-px flex-1 bg-hairline" />
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-hairline px-2 py-1.5 text-sm outline-none focus:border-brass" />
          <input type="password" required minLength={6} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-hairline px-2 py-1.5 text-sm outline-none focus:border-brass" />
          {msg && <p className="text-xs text-red-600">{msg}</p>}
          <button type="submit" disabled={busy} className="w-full rounded bg-navy px-3 py-2 text-sm font-semibold text-paper hover:bg-navy/90 disabled:opacity-50">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
          className="mt-3 w-full text-center text-xs text-navy/60 hover:text-brass">
          {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
