import { PageHeader } from "../sections.jsx";

const SECTIONS = [
  ["1. Agreement", "By creating an account or using Letterhead Studio, you agree to these terms."],
  ["2. Acceptable use", "Don't use the service to produce documents that are illegal, fraudulent, or that misrepresent another party. We may suspend accounts that do."],
  ["3. Your content", "You retain full ownership of the letterheads you upload and the documents you generate. By saving letterheads to your account, you grant us a limited licence to store and display them back to you (and only you)."],
  ["4. AI output", "AI-generated wording is provided as a starting point. You are responsible for verifying it before sending to clients, tax authorities, banks, or anyone else. We do not guarantee accuracy of computed totals — confirm them before publishing."],
  ["5. Plans & payments", "The Free plan is offered without charge. Paid plans (when available) are billed monthly via Stripe. We offer a 14-day refund on Pro plans during early access."],
  ["6. Service availability", "We aim for high availability but do not guarantee uptime. Scheduled maintenance and provider outages may interrupt service."],
  ["7. Termination", "You may delete your account at any time. We may terminate accounts that violate these terms after notice (except in cases of clear abuse, where notice may be skipped)."],
  ["8. Limitation of liability", "To the maximum extent permitted by law, our liability is limited to fees you paid in the previous twelve months."],
  ["9. Changes", "We may update these terms. Material changes will be announced in-product and emailed to active users."],
  ["10. Contact", "legal@letterheadstudio.app"],
];

export default function Terms() {
  return (
    <>
      <PageHeader eyebrow="Terms" title="Terms of Service" sub={`Effective ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`} />
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-3xl space-y-8 text-[15px] leading-relaxed text-ink/75">
          {SECTIONS.map(([h, b]) => (
            <div key={h}>
              <h3 className="display text-xl font-bold text-ink">{h}</h3>
              <p className="mt-2">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
