import { PageHeader, useReveal } from "../sections.jsx";

const LOG = [
  {
    v: "0.6",
    date: "Jun 2026",
    items: [
      "Multi-page marketing site with Features, Pricing, About and Changelog.",
      "Free tier: 5 AI-generated documents on every new account.",
      "Google sign-in alongside email/password.",
      "Premium UI polish in the app to match the marketing site.",
    ],
  },
  {
    v: "0.5",
    date: "Jun 2026",
    items: [
      "Accounts + cloud sync. Sign in to follow your letterheads and layouts across devices.",
      "Row Level Security: each account only ever sees its own data.",
    ],
  },
  {
    v: "0.4",
    date: "Jun 2026",
    items: [
      "Letterhead colour auto-detection.",
      "Voice input for the AI brief.",
      "Table block: editable pricing tables with VAT math.",
      "AI invoices now produce a real pricing table instead of plain text.",
    ],
  },
  {
    v: "0.3",
    date: "Jun 2026",
    items: [
      "AI describe → document: type a brief, AI writes the wording on your letterhead.",
      "Stamp / signature auto-blender with 3 transparent variants to pick from.",
    ],
  },
  {
    v: "0.2",
    date: "Jun 2026",
    items: [
      "Drag-drop block editor: text, line, table, image.",
      "Per-letterhead safe-zone memory.",
    ],
  },
  {
    v: "0.1",
    date: "Jun 2026",
    items: ["First public build: PDF generation on top of letterhead images."],
  },
];

export default function Changelog() {
  const ref = useReveal();
  return (
    <>
      <PageHeader eyebrow="Changelog" title={<>Shipping <span className="flourish font-normal text-brass">every week.</span></>} sub="A running log of what we ship. Newest at top." />
      <section ref={ref} className="px-5 pb-24">
        <div className="mx-auto max-w-3xl space-y-10">
          {LOG.map((r) => (
            <div key={r.v} className="reveal border-l-2 border-brass pl-6">
              <div className="flex items-baseline gap-3">
                <span className="display text-2xl font-bold text-ink">v{r.v}</span>
                <span className="label text-ink/45">{r.date}</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-ink/75">
                {r.items.map((i, n) => <li key={n}>— {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
