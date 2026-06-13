import { useState } from "react";
import { PageHeader, useReveal, APP_URL } from "../sections.jsx";
import { Mail, MessageCircle, ArrowRight } from "lucide-react";

export default function Contact() {
  const ref = useReveal();
  const [state, setState] = useState("idle"); // idle | sending | sent
  function submit(e) {
    e.preventDefault();
    setState("sending");
    // mailto fallback so the form does something useful without a backend.
    const f = new FormData(e.currentTarget);
    const body = `From: ${f.get("name")} <${f.get("email")}>%0D%0A%0D%0A${encodeURIComponent(f.get("msg") || "")}`;
    window.location.href = `mailto:hello@letterheadstudio.app?subject=${encodeURIComponent("Hi from " + (f.get("name") || "Letterhead Studio"))}&body=${body}`;
    setTimeout(() => setState("sent"), 600);
  }
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={<>We answer the email <span className="flourish font-normal text-brass">ourselves.</span></>}
        sub="Sales, support, feedback, partnership ideas — whichever fits. Usually back to you within a working day."
      />
      <section ref={ref} className="px-5 pb-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="reveal space-y-6">
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <Mail size={22} className="text-brass" />
              <h3 className="mt-3 font-display text-lg font-bold text-ink">Email</h3>
              <p className="mt-1 text-sm text-ink/60">For questions, support and business enquiries.</p>
              <a href="mailto:hello@letterheadstudio.app" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brass">hello@letterheadstudio.app <ArrowRight size={14} /></a>
            </div>
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <MessageCircle size={22} className="text-brass" />
              <h3 className="mt-3 font-display text-lg font-bold text-ink">In the app</h3>
              <p className="mt-1 text-sm text-ink/60">Already a user? Send us feedback from inside the studio.</p>
              <a href={APP_URL} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brass">Open the studio <ArrowRight size={14} /></a>
            </div>
          </div>
          <form onSubmit={submit} className="reveal rounded-2xl border border-hairline bg-white p-6 shadow-card">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Message" name="msg" textarea required />
            <button type="submit" disabled={state !== "idle"} className="btn-primary mt-4">
              {state === "idle" ? "Send message" : state === "sending" ? "Opening email…" : "Sent ✓"} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({ label, name, type = "text", required, textarea }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-ink/55">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} rows={5} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brass" />
      ) : (
        <input name={name} type={type} required={required} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brass" />
      )}
    </label>
  );
}
