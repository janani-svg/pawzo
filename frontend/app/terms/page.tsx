"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppFrame, TopBar, T } from "../components/pawzo-ui";

export default function TermsPage() {
  const params = useSearchParams();
  const fromSignup = params.get("ref") === "signup";
  return (
    <AppFrame>
      <TopBar title="Terms of Service" />
      <div style={{ padding: "8px 20px 48px", maxWidth: 680, margin: "0 auto" }}>
        <p style={{ fontSize: 11.5, color: T.grayLight, margin: "0 0 24px" }}>Last updated: June 2026</p>

        <Section title="1. Acceptance">
          By creating a Pawzo account or using the app, you agree to these Terms. If you do not agree, please do not use Pawzo. These Terms apply alongside our{" "}
          <Link href="/privacy" style={{ color: T.pink, fontWeight: 700 }}>Privacy Policy</Link>.
        </Section>

        <Section title="2. What Pawzo is">
          Pawzo is a personal pet care tracking app. It lets you log meals, health records, vaccinations, weight, expenses, memories, and calendar events for your pets, and chat with an AI assistant for general pet care tips.
        </Section>

        <Section title="3. Not a substitute for professional advice">
          Pawzo is an organisational tool — it is <b>not</b> a veterinary service. Nothing in the app (including AI chat responses) constitutes veterinary, medical, or professional advice. Always consult a qualified vet for your pet&apos;s health concerns. We are not liable for decisions made based on information in the app.
        </Section>

        <Section title="4. Your account">
          You must provide accurate information when signing up. You are responsible for keeping your password confidential and for all activity under your account. If you suspect unauthorised access, contact us immediately at{" "}
          <a href="mailto:pawzocare@gmail.com" style={{ color: T.pink, fontWeight: 700 }}>pawzocare@gmail.com</a>.
          You must be at least 13 years old to use Pawzo.
        </Section>

        <Section title="5. Acceptable use">
          You agree not to:<br /><br />
          • Use Pawzo for any unlawful purpose.<br />
          • Attempt to gain unauthorised access to any part of the service or its infrastructure.<br />
          • Upload content that is harmful, offensive, or infringes another person&apos;s rights.<br />
          • Reverse-engineer, scrape, or otherwise extract data from the app beyond normal use.
        </Section>

        <Section title="6. Your content">
          You own the data you enter into Pawzo (pet records, photos, notes, etc.). By using the app, you grant us a limited licence to store and process that data solely to provide the service to you. We do not claim ownership of your content.
        </Section>

        <Section title="7. AI chat">
          The Ask AI feature generates responses automatically and may be inaccurate, incomplete, or outdated. Always verify important information with a qualified professional. We are not responsible for actions taken based on AI responses.
        </Section>

        <Section title="8. Service availability">
          We aim to keep Pawzo running reliably, but we do not guarantee uninterrupted access. We may update, suspend, or discontinue features at any time. We will try to give notice for significant changes.
        </Section>

        <Section title="9. Limitation of liability">
          To the maximum extent permitted by law, Pawzo and its developers are not liable for any indirect, incidental, or consequential damages arising from your use of the app — including but not limited to loss of data, loss of pet records, or reliance on AI-generated advice.
        </Section>

        <Section title="10. Termination">
          You may stop using Pawzo at any time. We may suspend or terminate your account if you breach these Terms. On termination, your data will be deleted in accordance with our Privacy Policy.
        </Section>

        <Section title="11. Changes to these Terms">
          We may update these Terms from time to time. The &quot;last updated&quot; date at the top will reflect any changes. Continued use of the app after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="12. Contact">
          For any questions about these Terms, email us at{" "}
          <a href="mailto:pawzocare@gmail.com" style={{ color: T.pink, fontWeight: 700 }}>pawzocare@gmail.com</a>.
        </Section>

        {fromSignup && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Link href="/signup" style={{ color: T.pink, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Back to sign up</Link>
          </div>
        )}
      </div>
    </AppFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.65, margin: 0 }}>{children}</p>
    </div>
  );
}
