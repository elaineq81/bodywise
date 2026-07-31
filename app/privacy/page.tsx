import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Bodywise Remedy",
  description: "How Bodywise Remedy handles workout preferences, check-ins, progress, and app usage data.",
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <Link className="policy-back" href="/">← Back to Bodywise Remedy</Link>
      <section className="policy-hero">
        <p className="eyebrow">PRIVACY POLICY</p>
        <h1>Body-aware guidance, privacy-aware design.</h1>
        <p>
          Bodywise Remedy is designed to give useful workout guidance without asking for more personal information than the app needs.
        </p>
        <small>Last updated: July 31, 2026</small>
      </section>

      <section className="policy-card">
        <h2>What the app currently stores</h2>
        <p>
          The current app experience can store your selected goal, age range, sex selection, experience level, pain or limitation preference,
          mood/body check-ins, workout feedback, session count, and estimated training load. These are used to personalize the next workout.
        </p>
        <p>
          At this stage, these workout preferences and progress signals are stored locally on your device/browser unless a future account sync
          feature is clearly introduced.
        </p>
      </section>

      <section className="policy-card">
        <h2>Health and safety information</h2>
        <p>
          Bodywise Remedy is not a medical service and does not diagnose, treat, or prevent medical conditions. Pain and limitation questions are
          used only to avoid obvious workout mismatches and suggest gentler alternatives.
        </p>
        <p>
          Stop any movement that causes sharp pain, dizziness, chest pain, or unusual symptoms, and consult a qualified professional when needed.
        </p>
      </section>

      <section className="policy-card">
        <h2>Payments and subscriptions</h2>
        <p>
          If you subscribe through Apple, purchase and billing information is handled by Apple. Bodywise Remedy does not receive your full payment
          card details. Subscription cancellation and renewal are managed through your Apple ID subscription settings.
        </p>
      </section>

      <section className="policy-card">
        <h2>Network and media</h2>
        <p>
          The app may make standard network requests to load the app, workout videos, images, and technical status checks. Hosting providers may
          process basic technical data such as IP address, device/browser type, timestamps, and error logs for security and reliability.
        </p>
        <p>
          Bodywise Remedy does not sell personal information and does not use third-party advertising tracking in the current app experience.
        </p>
      </section>

      <section className="policy-card">
        <h2>Contact</h2>
        <p>
          For privacy or support questions, use the Support link in the app or the support contact listed in App Store Connect for Bodywise Remedy.
        </p>
      </section>
    </main>
  );
}
