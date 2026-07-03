"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppFrame, TopBar, T } from "../components/pawzo-ui";

export default function PrivacyPage() {
  return (
    <Suspense fallback={null}>
      <PrivacyPageInner />
    </Suspense>
  );
}

function PrivacyPageInner() {
  const params = useSearchParams();
  const fromSignup = params.get("ref") === "signup";
  return (
    <AppFrame>
      <TopBar title="Privacy Policy" />
      <div style={{ padding: "8px 20px 48px", maxWidth: 680, margin: "0 auto" }}>
        <p style={{ fontSize: 11.5, color: T.grayLight, margin: "0 0 24px" }}>Last updated: June 2026</p>

        <Section title="1. Who we are">
          Pawzo is a pet care companion app that helps you track your pet&apos;s meals, health records, growth, expenses, memories, and calendar events. We are operated as a personal project. For any questions, contact us at{" "}
          <a href="mailto:pawzopetcare@gmail.com" style={{ color: T.pink, fontWeight: 700 }}>pawzopetcare@gmail.com</a>.
        </Section>

        <Section title="2. What data we collect">
          <b>Account information:</b> your name, username, email address, and password (stored as a secure hash — we never store your plain-text password).<br /><br />
          <b>Profile photo:</b> an optional image URL you provide for your account or pet profiles.<br /><br />
          <b>Pet data:</b> everything you enter about your pets — species, breed, date of birth, weight, health records, vaccinations, meals, expenses, memories, and calendar events.<br /><br />
          <b>Chat messages:</b> messages you send to the Pawzo AI, including any images you attach, so your conversation history can be displayed in the app.<br /><br />
          <b>Activity data:</b> the dates you open the app, used only to calculate your care streak.
        </Section>

        <Section title="3. How we use your data">
          We use your data solely to provide the Pawzo service — showing you your pets&apos; information, generating AI responses, and displaying alerts and schedules. We do not use your data for advertising, profiling, or any purpose beyond operating the app.
        </Section>

        <Section title="4. AI chat">
          When you use the Ask AI feature, your messages (and relevant pet context) are processed by our AI service to generate responses. We do not share your data with any third parties beyond what is necessary to operate the app.
        </Section>

        <Section title="5. Data storage and security">
          Your data is stored in a PostgreSQL database. Passwords are hashed using bcrypt before storage. We take reasonable technical measures to protect your information, but no system is 100% secure — please use a strong, unique password.
        </Section>

        <Section title="6. Data retention">
          We keep your data for as long as your account is active. Alert records are automatically deleted after 7 days. If you delete a pet, all associated records (meals, health, expenses, memories, events) are permanently deleted. If you close your account, all your data is removed.
        </Section>

        <Section title="7. Your rights">
          You can update or delete your pet data at any time from within the app. To request deletion of your entire account and all associated data, email us at{" "}
          <a href="mailto:pawzopetcare@gmail.com" style={{ color: T.pink, fontWeight: 700 }}>pawzopetcare@gmail.com</a>{" "}
          and we will process it within 30 days.
        </Section>

        <Section title="8. Children">
          Pawzo is not directed at children under 13. We do not knowingly collect data from anyone under 13.
        </Section>

        <Section title="9. Changes to this policy">
          If we make material changes, we will update the date at the top of this page. Continued use of the app after changes means you accept the updated policy.
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
