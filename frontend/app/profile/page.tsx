"use client";

/* PAWZO Profile — real user data from the store. Shows actual name, stats
   (pet count, memory count, streak). No hardcoded demo values. Logout wired
   to store.logout(). */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, SectionTitle, T, IconGear, ChevronRight } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth } from "../lib/store";

const SECTIONS = [
  { label: "Calendar & events", href: "/calendar" },
  { label: "Memory gallery", href: "/memories" },
  { label: "Emergency", href: "/emergency" },
  { label: "Settings", href: "/settings" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, currentUser, myPets, streak, logout } = usePawzo();

  if (!ready || !authed) return null;

  const user = currentUser();
  const pets = myPets();
  const petIds = new Set(pets.map((p) => p.id));
  const memCount = state.memories.filter((m) => petIds.has(m.petId)).length;
  const initial = (user?.name?.[0] ?? "U").toUpperCase();

  function doLogout() {
    logout();
    router.push("/login");
  }

  return (
    <AppFrame>
      <TopBar
        title="Profile"
        back="/dashboard"
        right={
          <Link href="/settings" aria-label="Settings" style={{ color: T.grayLight, display: "flex" }}>
            <IconGear />
          </Link>
        }
      />

      <div style={{ padding: "4px 16px 0" }}>
        {/* header card — solid fill only, no gradient */}
        <div style={{ background: T.petPink, borderRadius: 22, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 70, height: 70, borderRadius: "50%", background: T.pink,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 28, fontWeight: 800, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: T.pinkDeep }}>{user?.name ?? "—"}</p>
            <p style={{ fontSize: 12.5, color: T.gray }}>@{user?.username ?? "—"}</p>
            <p style={{ fontSize: 11.5, color: T.gray, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? ""}</p>
          </div>
        </div>

        {/* real stats */}
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          {[
            { label: "Pets", value: String(pets.length) },
            { label: "Memories", value: String(memCount) },
            { label: "Day streak", value: String(streak()) },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "var(--p-surface)", borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: T.shadowSoft }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: T.pinkDeep }}>{s.value}</p>
              <p style={{ fontSize: 11, color: T.grayLight, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* navigation links */}
        <SectionTitle>More</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, boxShadow: T.shadowSoft, overflow: "hidden" }}>
          {SECTIONS.map((s, i) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div
                className="pawzo-press"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  borderBottom: i === SECTIONS.length - 1 ? "none" : "1px solid var(--p-border)",
                  cursor: "pointer",
                }}
              >
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>{s.label}</span>
                <ChevronRight color={T.grayLight} />
              </div>
            </Link>
          ))}
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
