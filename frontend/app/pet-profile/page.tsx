"use client";

/* PAWZO Pet Profile — SCREEN_FLOW §6. Read-only view of the pet's real data.
   "Update details" opens the editable form (returns here on save). Quick stats
   and the health snapshot are derived from stored records — no demo data. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, T, IconSpark, ChevronRight } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, ageFromDob, deriveAlerts, fmtDate, daysUntil } from "../lib/store";
import { speciesEmoji } from "../dashboard/page";
import { useEffect } from "react";

export default function PetProfilePage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, myPets } = usePawzo();

  const pets = ready ? myPets() : [];
  const pet = ready ? selectedPet() : null;

  useEffect(() => {
    if (ready && authed && pets.length === 0) router.replace("/pet-profile/new");
  }, [ready, authed, pets.length, router]);

  if (!ready || !authed || !pet) return null;

  const genderLabel = pet.gender === "male" ? "Male" : pet.gender === "female" ? "Female" : "Unknown";
  const vaccines = state.vaccinations.filter((v) => v.petId === pet.id && v.nextDue).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const nextVac = vaccines.find((v) => daysUntil(v.nextDue) >= 0) ?? vaccines[0];
  const vetVisits = state.health.filter((h) => h.petId === pet.id && h.kind === "vet").sort((a, b) => b.date.localeCompare(a.date));
  const activeMed = state.health.find((h) => h.petId === pet.id && h.kind === "medication" && h.active);
  const weights = state.weights.filter((w) => w.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = weights[0]?.weight ?? pet.weight;
  const alerts = deriveAlerts(state);

  const mealsToday = state.meals.filter((m) => m.petId === pet.id).length;

  return (
    <AppFrame bg={T.bg}>
      <TopBar back="/dashboard" centerLogo right={<button onClick={() => router.push(`/pet-profile/new?edit=${pet.id}`)} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--p-surface)", border: "1.5px solid var(--p-border)", borderRadius: 12, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, color: T.gray, cursor: "pointer" }}>Edit</button>} />

      {/* header card (read-only) */}
      <div style={{ padding: "4px 16px 0" }}>
        <div style={{ background: T.petPink, borderRadius: 24, padding: 18 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ borderRadius: 18, overflow: "hidden", border: `2.5px solid ${T.pink}`, width: 84, height: 84 }}>
                {pet.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{speciesEmoji(pet.species)}</div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.pinkDeep, letterSpacing: -0.4 }}>{pet.name}</div>
              <p style={{ fontSize: 12.5, color: T.gray, margin: "2px 0 8px" }}>{pet.breed || pet.species}{pet.dob ? ` · Born ${pet.dob}` : ""}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={statBadge}>{genderLabel}</span>
                <span style={statBadge}>{pet.species}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: "AGE", value: ageFromDob(pet.dob) },
              { label: "WEIGHT", value: `${latestWeight || "—"} kg` },
              { label: "TYPE", value: pet.species },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#9a7d8c", letterSpacing: 0.8, marginBottom: 5 }}>{s.label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: T.pinkDeep }}>{s.value}</p>
              </div>
            ))}
          </div>

          {pet.notes && <p style={{ fontSize: 12.5, color: "#7a5e6c", marginTop: 12, background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 12px" }}>📝 {pet.notes}</p>}

          <button onClick={() => router.push(`/pet-profile/new?edit=${pet.id}`)} className="pawzo-press" style={{ width: "100%", marginTop: 12, background: T.pink, border: "none", borderRadius: 14, padding: "12px 0", fontSize: 13.5, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
            Update details
          </button>
        </div>
      </div>

      {/* Ask AI */}
      <div style={{ padding: "12px 16px 0" }}>
        <Link href="/ai" style={{ textDecoration: "none" }}>
          <div className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 18, padding: "13px 16px", boxShadow: T.shadowSoft, cursor: "pointer" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><IconSpark color="#fff" /></div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Ask {pet.name}&apos;s AI</p>
              <p style={{ fontSize: 11, color: T.grayLight }}>Care tips for your {pet.species.toLowerCase()}</p>
            </div>
            <ChevronRight color={T.pink} />
          </div>
        </Link>
      </div>

      {/* Food / Health / Expense */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { emoji: "🍖", label: "Food", sub: mealsToday ? `${mealsToday} meals` : "Set menu", bg: "#FEFCE8", color: "#92400E", border: "#FDE68A", href: "/pet-profile/food" },
            { emoji: "💊", label: "Health", sub: nextVac ? `Vac ${fmtDate(nextVac.nextDue)}` : "Add records", bg: "#F0FDF4", color: "#166534", border: "#BBF7D0", href: "/pet-profile/health" },
            { emoji: "💳", label: "Expense", sub: "Track", bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", href: "/pet-profile/expenses" },
          ].map((c) => (
            <Link key={c.label} href={c.href} style={{ flex: 1, textDecoration: "none" }}>
              <div className="pawzo-press" style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 18, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 24 }}>{c.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{c.label}</span>
                <span style={{ fontSize: 9, color: c.color, opacity: 0.7, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{c.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Growth / Memories / Emergency */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 10 }}>
        <QuickLink href="/pet-profile/growth" emoji="📈" label="Growth" bg="#F5F0FF" border="#E0D2F5" color="#6B3FA0" />
        <QuickLink href="/memories" emoji="📷" label="Memories" bg="#FFF1F5" border="#FBD0E4" color={T.pinkDeep} />
        <QuickLink href="/emergency" emoji="🚑" label="Emergency" bg="#FEF2F2" border="#FECACA" color="#B91C1C" />
      </div>

      {/* Quick health snapshot (real) */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ background: "#EFF6FF", borderRadius: 20, padding: 16, border: "1.5px solid #BFDBFE" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", marginBottom: 12 }}>Quick health snapshot</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SnapRow icon="🏥" label="Last vet visit" value={vetVisits[0] ? fmtDate(vetVisits[0].date) : "—"} />
            <SnapRow icon="💉" label="Next vaccine" value={nextVac ? fmtDate(nextVac.nextDue) : "—"} />
            <SnapRow icon="💊" label="Active med" value={activeMed ? activeMed.title : "—"} />
          </div>
        </div>
      </div>

      <BottomNav alertCount={alerts.length} />
    </AppFrame>
  );
}

function QuickLink({ href, emoji, label, bg, border, color }: { href: string; emoji: string; label: string; bg: string; border: string; color: string }) {
  return (
    <Link href={href} style={{ flex: 1, textDecoration: "none" }}>
      <div className="pawzo-press" style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 18, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
        <span style={{ fontSize: 24 }}>{emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{label}</span>
      </div>
    </Link>
  );
}

function SnapRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "9px 12px", gap: 10, border: "1px solid rgba(191,219,254,0.6)" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12, color: "#5b6472", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF" }}>{value}</span>
    </div>
  );
}

const statBadge: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 20, padding: "3px 10px" };
