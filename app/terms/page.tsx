import Link from "next/link";

export const metadata = {
  title: "Terms — Bodywise Remedy",
  description: "Terms and safety information for using Bodywise Remedy.",
};

export default function TermsPage() {
  return (
    <main className="policy-page">
      <Link className="policy-back" href="/">← Back to Bodywise Remedy</Link>
      <section className="policy-hero">
        <p className="eyebrow">TERMS</p>
        <h1>Use Bodywise Remedy as guidance, not medical advice.</h1>
        <p>These terms summarize the key conditions for using the current Bodywise Remedy app experience.</p>
        <small>Last updated: July 31, 2026</small>
      </section>

      <section className="policy-card">
        <h2>Fitness risk</h2>
        <p>
          Exercise involves risk. You are responsible for deciding whether a movement is appropriate for your body, space, and ability. Stop if you
          feel sharp pain or unsafe symptoms.
        </p>
      </section>

      <section className="policy-card">
        <h2>No medical advice</h2>
        <p>
          Bodywise Remedy provides general fitness education and adaptive workout suggestions. It does not replace a doctor, physical therapist,
          trainer, or other qualified professional.
        </p>
      </section>

      <section className="policy-card">
        <h2>Subscriptions</h2>
        <p>
          Premium access is planned as a 7-day free trial followed by $6.99 monthly or $59.99 yearly unless cancelled before the trial ends.
          Final purchase terms are shown by Apple before confirmation and are managed through your Apple ID.
        </p>
      </section>

      <section className="policy-card">
        <h2>Content and availability</h2>
        <p>
          Workout movements, plans, media, and app features may be adjusted over time to improve clarity, safety, and reliability.
        </p>
      </section>
    </main>
  );
}
