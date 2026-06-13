import { PageHeader, FeaturesGrid, How, Documents, CTA, useReveal, SectionLabel } from "../sections.jsx";
import { Sparkles, Mic, Stamp, Palette, Table2, Cloud, ShieldCheck, MousePointerClick } from "lucide-react";

const DEEP = [
  {
    icon: Sparkles,
    title: "AI you can dictate to",
    body: "Type or speak a plain brief — the AI writes professional wording, builds the pricing table, and computes VAT. Every word is editable; nothing is locked. Works for invoices, quotations, salary certificates, NOC letters and more.",
  },
  {
    icon: MousePointerClick,
    title: "A real editor, not a form",
    body: "Drag any block to move it. Double-click to edit text. Use the side handle to resize. Duplicate, delete, send-to-back. The canvas IS the PDF — what you place is what prints.",
  },
  {
    icon: Stamp,
    title: "Signature & stamp that blend",
    body: "Drop a phone photo of your wet signature or company stamp. We auto-remove the paper, give you three cleaned variants, and place it as a transparent block. No Photoshop needed.",
  },
  {
    icon: Palette,
    title: "Reads your brand colour",
    body: "Upload the letterhead and we sample its dominant brand colour to set your accent automatically. Override any time with a single click.",
  },
  {
    icon: Table2,
    title: "Tables that compute",
    body: "Add a pricing block with description, quantity, unit price, amount. We do the arithmetic and the VAT, with right-aligned tabular figures and accent header.",
  },
  {
    icon: Mic,
    title: "Voice input",
    body: "Tap the mic, dictate the brief, the AI writes. Built on Web Speech — no servers see your audio.",
  },
  {
    icon: Cloud,
    title: "Cloud sync, encrypted",
    body: "Sign in once. Your letterheads, presets and brand colour follow you across browsers and devices. Per-user isolation enforced server-side by Row Level Security.",
  },
  {
    icon: ShieldCheck,
    title: "Your documents stay yours",
    body: "PDFs are generated in your browser — we don't store them on our servers. Only your reusable letterhead+layout templates sync to your account.",
  },
];

function DeepFeatures() {
  const ref = useReveal();
  return (
    <section ref={ref} className="px-5 py-16">
      <div className="mx-auto max-w-5xl space-y-12">
        {DEEP.map((d, i) => (
          <div key={d.title} className={"reveal grid items-center gap-8 md:grid-cols-[80px_1fr] " + (i % 2 ? "md:[direction:rtl]" : "")}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-brass shadow-card md:[direction:ltr]">
              <d.icon size={28} />
            </div>
            <div className="md:[direction:ltr]">
              <h3 className="display text-2xl font-bold text-ink">{d.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{d.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Features() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title={<>Everything you need to <span className="flourish font-normal text-brass">ship a document.</span></>}
        sub="No templates to fight. No layout to fix. Drop in your letterhead, describe what you need, and download a printable PDF."
      />
      <FeaturesGrid />
      <DeepFeatures />
      <How />
      <Documents />
      <CTA title="Try it on your own letterhead." sub="5 free AI documents on every new account. No credit card." />
    </>
  );
}
