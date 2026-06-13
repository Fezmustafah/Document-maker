import { PageHeader } from "../sections.jsx";

const SECTIONS = [
  ["1. What we collect", "Only what's required to run your account: your email, an encrypted password (or your Google sign-in), and the letterheads / layouts you choose to save. We do not collect analytics on document contents."],
  ["2. What we store on our servers", "Saved letterhead images and saved layout presets, tied to your user account. Stored in Supabase Postgres with Row Level Security so only your account can read them."],
  ["3. What we DO NOT store", "Finished PDFs. The actual documents you generate are produced in your browser and never sent to our servers. We do not retain copies."],
  ["4. AI prompts", "When you use the AI generator, your text brief and the active document type are sent to a Google Generative Language endpoint to produce wording. The brief is not used to train models. The active letterhead image is not sent."],
  ["5. Cookies", "We use a single session cookie from Supabase to keep you signed in. No third-party trackers, no advertising cookies."],
  ["6. Your rights", "You can export your data, delete your account, or revoke access at any time from inside the app. Mail privacy@letterheadstudio.app for assistance."],
  ["7. Contact", "Questions? privacy@letterheadstudio.app"],
];

export default function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy Policy" sub={`Last updated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`} />
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
