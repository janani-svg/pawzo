"use client";

import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, SectionTitle, T, ChevronRight } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, CURRENCIES } from "../lib/store";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ width: 46, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: on ? T.pink : "#E0D6EC", position: "relative", transition: "background 200ms", flexShrink: 0 }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function Row({ label, right, onClick, last }: { label: string; right?: React.ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "pawzo-press" : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: last ? "none" : "1px solid var(--p-border)", cursor: onClick ? "pointer" : "default" }}
    >
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>{label}</span>
      {right}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 13,
  fontWeight: 700,
  color: T.pinkDeep,
  cursor: "pointer",
  outline: "none",
  maxWidth: 180,
};

export default function SettingsPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, setSettings, logout } = usePawzo();

  if (!ready || !authed) return null;

  const { theme, push, email, sound, units, currency, language } = state.settings;

  function doLogout() {
    logout();
    router.push("/login");
  }

  return (
    <AppFrame>
      <TopBar title="Settings" back="/dashboard" />

      <div style={{ padding: "4px 16px 0" }}>
        {/* Appearance */}
        <SectionTitle>Appearance</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: 12, boxShadow: T.shadowSoft }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["light", "dark", "auto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                className="pawzo-press"
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  border: `2px solid ${theme === t ? T.pink : "transparent"}`,
                  background: theme === t ? T.primarySoft : "var(--p-surface-2)",
                  color: theme === t ? T.pinkDeep : T.gray,
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {t === "light" ? "☀️ Light" : t === "dark" ? "🌙 Dark" : "⚙️ Auto"}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <SectionTitle>Notifications</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, boxShadow: T.shadowSoft, overflow: "hidden" }}>
          <Row label="Push notifications" right={<Toggle on={push} onClick={() => setSettings({ push: !push })} />} />
          <Row label="Email notifications" right={<Toggle on={email} onClick={() => setSettings({ email: !email })} />} />
          <Row label="Sound effects" right={<Toggle on={sound} onClick={() => setSettings({ sound: !sound })} />} last />
        </div>

        {/* App preferences */}
        <SectionTitle>App preferences</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, boxShadow: T.shadowSoft, overflow: "hidden" }}>
          {/* Units */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--p-border)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.gray, marginBottom: 10 }}>Weight &amp; measurement units</p>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                { value: "metric",   label: "🌍 Metric",   sub: "kg · g · cm" },
                { value: "imperial", label: "🇺🇸 US / Imperial", sub: "lb · oz · in" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSettings({ units: opt.value })}
                  className="pawzo-press"
                  style={{
                    flex: 1, borderRadius: 12, padding: "10px 8px",
                    border: `2px solid ${units === opt.value ? T.pink : "transparent"}`,
                    background: units === opt.value ? T.primarySoft : "var(--p-surface-2)",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: units === opt.value ? T.pinkDeep : T.ink, marginBottom: 2 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: units === opt.value ? T.pink : T.grayLight }}>{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Currency — full dropdown */}
          <Row
            label="Currency"
            right={
              <select
                value={currency}
                onChange={(e) => setSettings({ currency: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                style={selectStyle}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            }
          />

          {/* Language — English only */}
          <Row
            label="Language"
            last
            right={
              <span style={{ fontSize: 13, fontWeight: 700, color: T.pinkDeep }}>
                English <span style={{ color: T.grayLight, fontWeight: 500 }}>(Default)</span>
              </span>
            }
          />
        </div>

        {/* Privacy */}
        <SectionTitle>Privacy &amp; data</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, boxShadow: T.shadowSoft, overflow: "hidden" }}>
          <Row label="Privacy policy" right={<ChevronRight color={T.grayLight} />} onClick={() => router.push("/privacy")} />
          <Row label="Terms of use" right={<ChevronRight color={T.grayLight} />} onClick={() => router.push("/terms")} last />
        </div>

        <button
          className="pawzo-press"
          onClick={doLogout}
          style={{ marginTop: 14, width: "100%", textAlign: "center", padding: "14px", borderRadius: 16, background: "var(--p-surface)", color: T.danger, fontWeight: 800, fontSize: 14, boxShadow: T.shadowSoft, cursor: "pointer", border: "none" }}
        >
          Log out
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: T.grayLight, margin: "14px 0 6px" }}>Pawzo v1.0</p>
      </div>

      <BottomNav />
    </AppFrame>
  );
}
