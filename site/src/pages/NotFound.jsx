import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="grid min-h-[60vh] place-items-center px-5 pt-32">
      <div className="text-center">
        <div className="label mb-3 text-brass">404</div>
        <h1 className="display text-5xl font-extrabold text-ink">That page doesn't exist.</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/60">Maybe a typo, maybe an old link. Try the homepage.</p>
        <Link to="/" className="btn-primary mt-8 inline-flex">Back home <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}
