import Link from "next/link";

export const metadata = {
  title: "Support — Bodywise Remedy",
  description: "Get help with Bodywise Remedy workouts, subscriptions, safety, and app access.",
};

export default function SupportPage() {
  return (
    <main className="policy-page">
      <Link className="policy-back" href="/">← Back to Bodywise Remedy</Link>
      <section className="policy-hero">
        <p className="eyebrow">SUPPORT</p>
        <h1>We want Bodywise Remedy to feel simple, safe, and clear.</h1>
        <p>
          Use this page for common help topics while the full support desk is being prepared for App Store launch.
        </p>
      </section>

      <section className="policy-card">
        <h2>Workout guidance</h2>
        <p>
          Pick your main goal, complete the quick Body Check, then start your session. If a movement feels wrong for your body, use a gentler
          alternative or stop the session.
        </p>
      </section>

      <section className="policy-card">
        <h2>Pain or limitations</h2>
        <p>
          Bodywise Remedy uses pain/limitation selections to reduce obvious mismatch, but it is not medical care. Do not train through sharp pain,
          numbness, dizziness, chest pain, or symptoms that feel unusual.
        </p>
      </section>

      <section className="policy-card">
        <h2>Subscription help</h2>
        <p>
          If you start the 7-day free trial through Apple, Apple manages billing and cancellation. You can cancel from iPhone Settings → Apple ID →
          Subscriptions before the trial ends to avoid renewal.
        </p>
      </section>

      <section className="policy-card">
        <h2>App Store review contact</h2>
        <p>
          Before final submission, add the official Bodywise Remedy support email/URL in App Store Connect so Apple and customers have a real support
          destination outside the app.
        </p>
      </section>
    </main>
  );
}
