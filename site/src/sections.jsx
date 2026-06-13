// Shared section primitives + reusable blocks for the marketing site.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles, Mic, MousePointerClick, Stamp, Palette, Table2, Cloud,
  FileText, Receipt, ScrollText, BadgeCheck, ArrowRight, ArrowUpRight,
  Wand2, FileSignature, Languages, ShieldCheck, Wallet, Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import { APP_URL } from "./Layout.jsx";

gsap.registerPlugin(ScrollTrigger);

export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(".reveal");
    const t = gsap.to(items, {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 78%" },
    });
    return () => t.scrollTrigger && t.scrollTrigger.kill();
  }, []);
  return ref;
}

export function SectionLabel({ children }) {
  return (
    <div className="reveal label mb-3 flex items-center gap-2 text-brass">
      <span className="h-px w-8 bg-brass" />{children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub }) {
  return (
    <section className="px-5 pt-32 pb-12 md:pt-40">
      <div className="mx-auto max-w-4xl text-center">
        <div className="label mb-4 text-brass">{eyebrow}</div>
        <h1 className="display text-4xl font-extrabold text-ink sm:text-6xl">{title}</h1>
        {sub && <p className="mx-auto mt-5 max-w-2xl text-lg text-ink/65">{sub}</p>}
      </div>
    </section>
  );
}

/* ----- document mockup ----- */
export function DocumentMockup() {
  const sigRef = useRef(null);
  useEffect(() => {
    const p = sigRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", delay: 1.1 });
  }, []);
  return (
    <div className="relative w-full max-w-[420px]">
      <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-brass/20 to-ink/10 blur-2xl" />
      <div className="overflow-hidden rounded-[18px] bg-white shadow-lift ring-1 ring-ink/5">
        <div className="bg-ink px-6 py-4">
          <div className="font-serif text-lg font-semibold tracking-wide text-paper">MERIDIAN TRADING L.L.C</div>
          <div className="text-[10px] tracking-wide text-paper/70">General Trading &amp; Services · Dubai, U.A.E</div>
        </div>
        <div className="h-1 bg-brass" />
        <div className="space-y-3 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-[15px] font-extrabold tracking-tight text-ink">QUOTATION</div>
              <div className="mt-0.5 text-[10px] text-slate">Ref: QTN/2026-001</div>
            </div>
            <div className="rounded border border-hairline px-2 py-1 text-[10px] text-ink">29 May 2026</div>
          </div>
          <div className="overflow-hidden rounded-md ring-1 ring-hairline">
            <div className="grid grid-cols-[1fr_auto_auto] bg-ink text-[9px] font-semibold text-paper">
              <div className="px-2 py-1.5">Description</div>
              <div className="px-2 py-1.5 text-right">Qty</div>
              <div className="px-2 py-1.5 text-right">Amount</div>
            </div>
            {[["Premium service package", "2,500", "26,875.00"], ["On-site delivery", "2,500", "Included"]].map((r, i) => (
              <div key={i} className={"grid grid-cols-[1fr_auto_auto] text-[9px] text-ink " + (i % 2 ? "bg-paper/60" : "bg-white")}>
                <div className="px-2 py-1.5">{r[0]}</div>
                <div className="px-2 py-1.5 text-right tabular-nums">{r[1]}</div>
                <div className="px-2 py-1.5 text-right tabular-nums">{r[2]}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] bg-ink/[0.04] text-[9px] font-bold text-ink">
              <div className="px-2 py-1.5 text-right">Total per Friday</div>
              <div className="px-2 py-1.5 text-right tabular-nums">AED 26,875.00</div>
            </div>
          </div>
          <div className="pt-2 text-[9px] italic text-slate">Twenty-Six Thousand Eight Hundred Seventy-Five Dirhams Only</div>
          <div className="flex items-end justify-end pt-1">
            <div className="text-right">
              <svg viewBox="0 0 120 40" className="ml-auto h-9 w-28">
                <path ref={sigRef} className="sig-path" d="M6 28 C 18 6, 26 38, 38 18 S 58 4, 70 24 C 78 36, 88 8, 100 20 L 114 14"
                  fill="none" stroke="#11203A" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <div className="border-t border-ink/30 pt-1 text-[10px] font-semibold text-ink">A. Rahman</div>
              <div className="text-[8px] text-slate">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-5 top-24 hidden rotate-3 rounded-xl bg-white px-3 py-2 shadow-card ring-1 ring-hairline sm:block">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink"><Sparkles size={12} className="text-brass" /> Written by AI</div>
      </div>
    </div>
  );
}

/* ----- features ----- */
export const FEATURES = [
  { icon: Wand2, t: "Describe it, done", d: "Type or speak a rough brief — “quotation, 2,500 meal boxes at 10.75, valid 30 days.” AI writes the wording, the table, and the totals." },
  { icon: MousePointerClick, t: "Move anything", d: "Every block — heading, paragraph, table, signature — drags, edits, duplicates and deletes. Nothing is locked." },
  { icon: Stamp, t: "Signature & stamp, blended", d: "Drop a photo of your signature or stamp. It auto-removes the paper background and gives you three clean, ready-to-place versions." },
  { icon: Palette, t: "Reads your brand colour", d: "Detects the accent in your letterhead automatically — no colour picker, no second-guessing." },
  { icon: Table2, t: "Real pricing tables", d: "Line items, VAT and totals — calculated for you. Right-aligned, tabular figures, ready to print." },
  { icon: Mic, t: "Speak instead of type", d: "Dictate the brief; it transcribes and writes. Faster than typing on a phone." },
  { icon: Cloud, t: "Cloud sync, free", d: "Sign in once. Your letterheads and layouts follow you across devices, encrypted per user." },
  { icon: ShieldCheck, t: "Your data, your device", d: "We never store your documents on our servers. Your letterheads stay in your account; the PDF stays in your hand." },
];

export function FeaturesGrid({ items = FEATURES }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((f) => (
            <div key={f.t} className="reveal group rounded-2xl border border-hairline bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-brass/40">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-brass transition group-hover:bg-brass group-hover:text-ink">
                <f.icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-ink">{f.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- how ----- */
export const STEPS = [
  { n: "01", t: "Add your letterhead", d: "Upload the blank letterhead image once — the same JPG/PNG your designer or WhatsApp sends. Set the safe zone once; it's remembered." },
  { n: "02", t: "Describe or drag", d: "Tell the AI what you need, or build it by hand with blocks. Tables, signatures, stamps — all editable." },
  { n: "03", t: "Download & send", d: "Export a crisp, print-ready PDF named for the company. Save it to your account and reuse it next month in one click." },
];
export function How() {
  const ref = useReveal();
  return (
    <section id="how" ref={ref} className="grain-dark px-5 py-24 text-paper">
      <div className="mx-auto max-w-6xl">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="reveal display max-w-2xl text-4xl font-bold sm:text-5xl">Three steps. One clean PDF.</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="reveal rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <div className="font-serif text-4xl text-brass">{s.n}</div>
              <h3 className="mt-3 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-paper/60">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- documents ----- */
export const DOCS = [
  { icon: Receipt, t: "Tax Invoice" },
  { icon: FileText, t: "Invoice" },
  { icon: FileSignature, t: "Quotation" },
  { icon: FileText, t: "Proforma Invoice" },
  { icon: ScrollText, t: "Statement of Account" },
  { icon: BadgeCheck, t: "Salary Certificate" },
  { icon: Languages, t: "NOC / Letters" },
  { icon: Sparkles, t: "…or anything you describe" },
];
export function Documents() {
  const ref = useReveal();
  return (
    <section ref={ref} className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel>Documents</SectionLabel>
        <h2 className="reveal display max-w-2xl text-4xl font-bold text-ink sm:text-5xl">
          One tool for every document <span className="flourish font-normal text-brass">your business sends.</span>
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline md:grid-cols-4">
          {DOCS.map((d) => (
            <div key={d.t} className="reveal group flex min-h-[140px] flex-col justify-between bg-white p-6 transition hover:bg-paper">
              <d.icon size={22} className="text-brass" />
              <div className="font-display text-[15px] font-semibold text-ink">{d.t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- count up ----- */
export function CountUp({ to, suffix = "", prefix = "", decimals = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const obj = { v: 0 };
        gsap.to(obj, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = prefix + obj.v.toFixed(decimals) + suffix; } });
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ----- CTA band ----- */
export function CTA({ title, sub, primary = "Start free", primaryHref = APP_URL }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="px-5 py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] grain-dark px-8 py-16 text-center text-paper">
        <h2 className="reveal display mx-auto max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h2>
        {sub && <p className="reveal mx-auto mt-5 max-w-xl text-paper/65">{sub}</p>}
        <div className="reveal mt-9 flex flex-wrap justify-center gap-3">
          <a href={primaryHref} className="btn-primary bg-brass text-deep">{primary} <ArrowRight size={18} /></a>
          <a href={APP_URL} className="btn-ghost border-paper/25 text-paper hover:border-brass">Open the studio <ArrowUpRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}

export { APP_URL };
