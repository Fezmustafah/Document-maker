import { PageHeader, CTA, useReveal } from "../sections.jsx";
import { Compass, Lightbulb, ShieldCheck, Globe } from "lucide-react";

const VALUES = [
  { icon: Compass, t: "Make the obvious work", d: "Most business docs are templates. The obvious move is to let the user describe one in plain words and have it appear, edited, on their letterhead. So we built that." },
  { icon: Lightbulb, t: "Respect the user's time", d: "Every interaction is one click less than the last. We measure the tool by seconds saved per document, not features added per quarter." },
  { icon: ShieldCheck, t: "Your data is not the product", d: "We don't store your PDFs. We don't read your documents. We don't sell your usage. Your letterhead is yours; your output is yours." },
  { icon: Globe, t: "Built in Dubai, made for the world", d: "We started for SMBs in the UAE that get blank letterheads on WhatsApp. The same problem exists for every small business everywhere." },
];

export default function About() {
  const ref = useReveal();
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={<>A finance tool, <span className="flourish font-normal text-brass">disguised as software.</span></>}
        sub="Letterhead Studio is a small, focused product made by a small, focused team. We ship weekly. We answer email. We don't raise rounds we don't need."
      />
      <section ref={ref} className="px-5 py-12">
        <div className="mx-auto max-w-4xl space-y-6 text-[17px] leading-relaxed text-ink/75">
          <p className="reveal">
            Every operations manager in a small business has the same routine: a client asks for a quotation. You open a Word doc, copy last month's, change the numbers, fight the spacing, save as PDF, send. Twenty minutes you'll never get back.
          </p>
          <p className="reveal">
            We thought: what if the document just <em>appeared</em> on your letterhead — properly worded, properly spaced — from a single sentence? And what if it took thirty seconds instead of twenty minutes?
          </p>
          <p className="reveal">
            So we built that. The tool runs in your browser, prints to PDF, and remembers what's yours across devices. It's free to try, free to keep using, and the AI feature has a generous starter quota.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.t} className="reveal rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <v.icon size={22} className="text-brass" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{v.t}</h3>
              <p className="mt-1.5 text-sm text-ink/60">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
      <CTA title={<>Less time on docs. <span className="flourish font-normal text-brass">More time on business.</span></>} />
    </>
  );
}
