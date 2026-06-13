import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { DocumentMockup, FeaturesGrid, How, Documents, CTA, CountUp, useReveal, SectionLabel, APP_URL } from "../sections.jsx";

function Hero() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-stagger", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.1 });
      gsap.from(".hero-mock", { y: 40, opacity: 0, scale: 0.96, duration: 1.1, ease: "power3.out", delay: 0.5 });
      gsap.to(".float-mote", { y: -16, repeat: -1, yoyo: true, duration: 3, ease: "sine.inOut", stagger: 0.4 });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={root} className="relative overflow-hidden px-5 pb-20 pt-32 md:pt-40">
      <div className="pointer-events-none absolute right-[8%] top-[20%] -z-10 hidden lg:block">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="float-mote absolute block rounded-full bg-brass/30"
            style={{ width: 8 - i, height: 8 - i, left: i * 34, top: i * 26 }} />
        ))}
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="hero-stagger label inline-flex items-center gap-2 rounded-full border border-hairline bg-white/60 px-3 py-1.5 text-ink/70">
            <span className="h-1.5 w-1.5 rounded-full bg-brass" /> AI documents on your own letterhead
          </div>
          <h1 className="hero-stagger display mt-6 text-[2.7rem] font-extrabold text-ink sm:text-6xl">
            Professional documents,<br />
            <span className="flourish font-normal text-brass">in the time it takes to ask.</span>
          </h1>
          <p className="hero-stagger mt-6 max-w-xl text-lg leading-relaxed text-ink/65">
            Upload your company letterhead once. Then just <em>describe</em> the invoice, quotation or
            letter you need — by typing or talking — and it's written, perfectly spaced, and ready to
            print on your own letterhead.
          </p>
          <div className="hero-stagger mt-8 flex flex-wrap items-center gap-3">
            <a href={APP_URL} className="btn-primary">Start free <ArrowRight size={18} /></a>
            <a href="#proof" className="btn-ghost">See it work</a>
          </div>
          <div className="hero-stagger mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/55">
            <span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-brass" /> 5 free AI docs to start</span>
            <span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-brass" /> No credit card</span>
            <span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-brass" /> Cloud sync</span>
          </div>
        </div>
        <div className="hero-mock flex justify-center lg:justify-end">
          <DocumentMockup />
        </div>
      </div>
    </section>
  );
}

function Proof() {
  const ref = useReveal();
  const stats = [
    { node: <><CountUp to={30} suffix="s" /></>, label: "to a finished document" },
    { node: <><CountUp to={8} suffix="+" /></>, label: "document types, one tool" },
    { node: <>AED <CountUp to={0} /></>, label: "to start — free forever tier" },
  ];
  return (
    <section id="proof" ref={ref} className="px-5 pb-8 pt-4">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-hairline bg-white p-10 shadow-card sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={i} className="reveal text-center">
            <div className="font-display text-5xl font-extrabold tracking-tight text-ink">{s.node}</div>
            <div className="mt-2 text-sm text-ink/55">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesShort() {
  const ref = useReveal();
  return (
    <section ref={ref} className="px-5 pt-16">
      <div className="mx-auto max-w-6xl">
        <SectionLabel>What it does</SectionLabel>
        <h2 className="reveal display max-w-2xl text-4xl font-bold text-ink sm:text-5xl">
          The finance department, <span className="flourish font-normal text-brass">without the finance department.</span>
        </h2>
      </div>
      <FeaturesGrid items={undefined /* default 8 */} />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Proof />
      <FeaturesShort />
      <How />
      <Documents />
      <CTA
        title={<>Your next invoice is <span className="flourish font-normal text-brass">one sentence away.</span></>}
        sub="Stop rebuilding documents by hand or waiting on a designer. Describe it once — keep the polish forever."
      />
    </>
  );
}
