"use client";

/* PAWZO Dashboard — SCREEN_FLOW §4. Shows the user's real pets in a horizontal
   carousel (with an Add-Pet card), real Calendar/Memories widgets, today's
   schedule derived from meals + events, and an activity-based streak. No demo
   data; everything reads from the store. Solid fills only. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, PawzoLogo, T, IconGear, IconPlus, ChevronRight } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, deriveAlerts, todayISO } from "../lib/store";

export default function Dashboard() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, myPets, currentUser, selectPet, toggleMealLog, streak } = usePawzo();

  if (!ready || !authed) return null;

  const pets = myPets();
  const user = currentUser();
  const today = todayISO();
  const alerts = deriveAlerts(state);

  // today's schedule = today's meals (per pet) + today's events
  const todaysMeals = state.meals
    .filter((m) => pets.some((p) => p.id === m.petId))
    .map((m) => {
      const pet = pets.find((p) => p.id === m.petId)!;
      const log = state.mealLogs.find((l) => l.petId === m.petId && l.mealId === m.id && l.date === today);
      return { type: "meal" as const, id: m.id, petId: m.petId, label: `${m.name} · ${pet.name}`, time: m.time, done: !!log?.done };
    });
  const todaysEvents = state.events.filter((e) => e.date === today && pets.some((p) => p.id === e.petId));
  const memCount = state.memories.filter((mm) => pets.some((p) => p.id === mm.petId)).length;
  const upcomingEvents = state.events.filter((e) => pets.some((p) => p.id === e.petId) && e.date >= today).length;

  return (
    <AppFrame>
      {/* header — no calendar/memory buttons */}
      <header style={{ position: "relative", background: "transparent", padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Link href="/settings" aria-label="Settings" style={{ position: "absolute", left: 16, color: T.grayLight, display: "flex" }}><IconGear /></Link>
        <PawzoLogo size={25} />
        <Link href="/profile" aria-label="Profile" style={{ position: "absolute", right: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
            {(user?.name?.[0] ?? "U").toUpperCase()}
          </div>
        </Link>
      </header>

      <main style={{ padding: "10px 0 0" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: "0 16px 12px" }}>
          Hi, {user?.name?.split(" ")[0] ?? "there"}
        </h1>

        {/* MY PETS carousel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 16px 10px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>My Pets</h2>
          {pets.length > 0 && <span style={{ fontSize: 12, color: T.grayLight, fontWeight: 600 }}>{pets.length} {pets.length === 1 ? "pet" : "pets"}</span>}
        </div>

        {pets.length === 0 ? (
          <div style={{ margin: "0 16px 16px" }}>
            <div style={{ background: "#FFB7C3", borderRadius: 20, padding: "28px 20px", textAlign: "center" }}>
              <div className="pawzo-bob" style={{ fontSize: 52, marginBottom: 10 }}>🐾</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#7A1030" }}>No pets yet!</p>
              <p style={{ fontSize: 13, color: "#9A2040", margin: "4px 0 16px", opacity: 0.85 }}>Add your first furry friend to get started.</p>
              <button onClick={() => router.push("/pet-profile/new")} className="pawzo-press" style={{ background: "#BA324F", color: "#fff", border: "none", borderRadius: 14, padding: "12px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconPlus color="#fff" size={16} /> Add Pet
              </button>
            </div>
          </div>
        ) : (
          <div className="no-scrollbar" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 16px 14px", scrollSnapType: "x mandatory" }}>
            {pets.map((pet) => {
              const cardBg = speciesBg(pet.species);
              return (
                <button key={pet.id} onClick={() => { selectPet(pet.id); router.push("/pet-profile"); }} className="pawzo-press" style={{ flexShrink: 0, width: 150, scrollSnapAlign: "start", background: cardBg, borderRadius: 20, padding: 10, border: "none", cursor: "pointer", boxShadow: T.shadow, textAlign: "center" }}>
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "3px solid rgba(255,255,255,0.7)" }}>
                    {pet.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photo} alt={pet.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1", background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>{speciesEmoji(pet.species)}</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 800, fontSize: 15, color: "#175676" }}>{pet.name}</div>
                  <div style={{ fontSize: 11.5, color: "#4BA3C3", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pet.breed || pet.species}</div>
                </button>
              );
            })}
            <button onClick={() => router.push("/pet-profile/new")} className="pawzo-press" aria-label="Add a new pet" style={{ flexShrink: 0, width: 150, scrollSnapAlign: "start", background: "#D9F2B4", border: "2px dashed #8BBF60", borderRadius: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 196 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#3A6EA5", display: "flex", alignItems: "center", justifyContent: "center" }}><IconPlus color="#fff" size={24} /></div>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#175676" }}>Add Pet</span>
            </button>
          </div>
        )}

        {/* Calendar + Memories widgets */}
        <div style={{ display: "flex", gap: 12, padding: "0 16px 12px" }}>
          <Link href="/calendar" style={{ flex: 1, textDecoration: "none" }}>
            <div className="pawzo-press" style={{ background: "#BCF4F5", borderRadius: 18, padding: "12px 12px 10px", minHeight: 130 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#175676", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                📅 <span>Calendar</span>
                {upcomingEvents > 0 && <span style={{ background: "#175676", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px", marginLeft: "auto" }}>{upcomingEvents}</span>}
              </h3>
              <MiniCalendar eventDates={state.events.filter(e => pets.some(p => p.id === e.petId)).map(e => e.date)} />
            </div>
          </Link>
          <Link href="/memories" style={{ flex: 1, textDecoration: "none" }}>
            <div className="pawzo-press" style={{ background: "#B4EBCA", borderRadius: 18, padding: "12px 12px 10px", minHeight: 130 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1A6B3A", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                ✨ <span>Memories</span>
                {memCount > 0 && <span style={{ background: "#1A6B3A", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px", marginLeft: "auto" }}>{memCount}</span>}
              </h3>
              <MemoryThumbs memories={state.memories.filter(mm => pets.some(p => p.id === mm.petId))} />
            </div>
          </Link>
        </div>

        {/* streak */}
        {pets.length > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "#D9F2B4", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>🔥</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#3A6B00" }}>{streak()}-day streak</p>
                <p style={{ fontSize: 11.5, color: "#3A6B00", opacity: 0.8 }}>{streak() > 0 ? "Keep the momentum going! 💪" : "Log something today to start a streak."}</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <section style={{ background: "#CCE6F4", borderRadius: 20, margin: "0 16px", padding: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#175676", margin: "0 0 14px" }}>📋 Today&apos;s Schedule</h3>
          {todaysMeals.length === 0 && todaysEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: "#4BA3C3", textAlign: "center", padding: "10px 0" }}>
              Nothing scheduled yet. Add meals or events to see them here. 🗓️
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todaysMeals.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: m.done ? "#D3FAC7" : "#FFFFFF", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <button onClick={() => toggleMealLog(m.petId, m.id, today)} style={{ width: 22, height: 22, border: `2px solid ${m.done ? "#2E8B40" : "#4BA3C3"}`, background: m.done ? "#2E8B40" : "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }} aria-label="Toggle meal">
                    {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <span style={{ flex: 1, fontSize: 14, color: m.done ? "#4BA3C3" : "#175676", textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
                  <span style={{ fontSize: 11.5, color: "#4BA3C3", fontWeight: 600 }}>{m.time}</span>
                </div>
              ))}
              {todaysEvents.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#E7F59E", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize: 18 }}>{e.emoji || "📅"}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "#3A6B00", fontWeight: 600 }}>{e.title}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav alertCount={alerts.length} />
    </AppFrame>
  );
}

export function speciesEmoji(s: string) {
  const m: Record<string, string> = { Dog: "🐶", Cat: "🐱", Bird: "🦜", Rabbit: "🐰", "Guinea pig": "🐹", Hamster: "🐹", Fish: "🐠", Reptile: "🦎" };
  return m[s] ?? "🐾";
}

/* pastel card background per species — design system pet colors */
export function speciesBg(s: string) {
  const m: Record<string, string> = {
    Dog:        "#FFB7C3",  // Blush Pink
    Cat:        "#BCF4F5",  // Soft Sky
    Bird:       "#D9F2B4",  // Sunshine Yellow
    Rabbit:     "#B4EBCA",  // Minty Fresh
    "Guinea pig": "#D3FAC7", // Grass Green
    Hamster:    "#E7F59E",  // Lemon
    Fish:       "#CCE6F4",  // Cloud Soft
    Reptile:    "#B4EBCA",  // Minty Fresh
  };
  return m[s] ?? "#D9F2B4";
}

/* mini calendar grid — shows current month with today highlighted + event dots */
function MiniCalendar({ eventDates }: { eventDates: string[] }) {
  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth();
  const todayD  = now.getDate();
  const firstDOW = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, "0");
  const eventSet = new Set(
    eventDates
      .filter(d => d.startsWith(`${year}-${monthStr}`))
      .map(d => parseInt(d.slice(8, 10), 10))
  );
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDOW; i++) cells.push(null);
  for (let d = 1; d <= daysInM; d++) cells.push(d);

  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: "#1A5276", opacity: 0.65, margin: "0 0 4px", textAlign: "center" }}>
        {now.toLocaleString("default", { month: "long" })} {year}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px 0", marginBottom: 2 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ fontSize: 7.5, fontWeight: 700, color: "#1A5276", textAlign: "center", opacity: 0.6, paddingBottom: 2 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: "center", position: "relative" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%",
              fontSize: 8, fontWeight: d === todayD ? 800 : 400,
              background: d === todayD ? "#1A5276" : "transparent",
              color: d === todayD ? "#fff" : "#1A5276",
              opacity: d ? 1 : 0,
            }}>{d}</span>
            {d && d !== todayD && eventSet.has(d) && (
              <span style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#BA324F", display: "block" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* memory thumbnails — up to 4 recent photos, or photo-album SVG default */
function MemoryThumbs({ memories }: { memories: Array<{ id: string; photo: string; caption: string; date: string }> }) {
  const recent = [...memories].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  if (recent.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 2 }}>
        {/* Photo album illustration */}
        <svg viewBox="0 0 80 60" style={{ width: 72, height: 54, display: "block", margin: "0 auto 4px" }}>
          {/* Album cover */}
          <rect x="6" y="4" width="68" height="52" rx="6" fill="#FFFFFF" opacity="0.7"/>
          <rect x="2" y="6" width="68" height="52" rx="6" fill="#FFFFFF" opacity="0.85"/>
          {/* Photo frames inside */}
          <rect x="8" y="10" width="26" height="20" rx="3" fill="#BCF4F5"/>
          <rect x="38" y="10" width="26" height="20" rx="3" fill="#FFB7C3"/>
          <rect x="8" y="34" width="26" height="20" rx="3" fill="#D9F2B4"/>
          <rect x="38" y="34" width="26" height="20" rx="3" fill="#D9F2B4" opacity="0.5"/>
          {/* "+" on the empty slot */}
          <text x="51" y="47" fontSize="12" fill="#1A6B3A" textAnchor="middle" fontWeight="700">+</text>
          {/* Tiny mountain in BCF4F5 frame */}
          <path d="M12 27 L20 14 L28 27 Z" fill="#4BA3C3" opacity="0.6"/>
          <circle cx="24" cy="16" r="3" fill="#D9F2B4" opacity="0.8"/>
          {/* Tiny paw in pink frame */}
          <text x="51" y="24" fontSize="12" textAnchor="middle">🐾</text>
          {/* Tiny tree in green frame */}
          <circle cx="21" cy="38" r="6" fill="#2E8B40" opacity="0.5"/>
          <rect x="20" y="44" width="2" height="8" fill="#6B4A00" opacity="0.5"/>
        </svg>
        <p style={{ fontSize: 10.5, color: "#1A6B3A", fontWeight: 700 }}>No memories yet</p>
        <p style={{ fontSize: 9, color: "#1A6B3A", opacity: 0.7 }}>Tap to capture moments! 📷</p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      {recent.map(m => (
        <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "#80C898" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.photo} alt={m.caption || "Memory"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}
