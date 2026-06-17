"use client";

/* PAWZO Memory Journal — real photo snapshots only, grouped by date. The
   camera icon (top-left) opens the device camera; uploads are saved to the
   journal. No sample cards, no AI/schedule sections. */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, T, IconPlus } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate, fileToDataURL } from "../lib/store";

export default function MemoriesPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, myPets, add, remove } = usePawzo();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pet = ready ? selectedPet() : null;
  const pets = ready ? myPets() : [];
  if (!ready || !authed) return null;

  const memories = state.memories.filter((m) => pets.some((p) => p.id === m.petId)).sort((a, b) => b.date.localeCompare(a.date));
  // group by date
  const groups: Record<string, typeof memories> = {};
  memories.forEach((m) => { (groups[m.date] ||= []).push(m); });
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !pet) return;
    setBusy(true);
    const photo = await fileToDataURL(f, 1200);
    add("memories", { petId: pet.id, photo, caption: "", date: todayISO() });
    setBusy(false);
    e.target.value = "";
  }

  return (
    <AppFrame>
      {/* top bar with camera icon at top-left */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--p-topbar)", backdropFilter: "blur(8px)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => camRef.current?.click()} aria-label="Open camera" className="pawzo-press" style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0 }}>Memories</h1>
        <button onClick={() => galRef.current?.click()} aria-label="Add from gallery" className="pawzo-press" style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "var(--p-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: T.shadowSoft }}>
          <IconPlus color={T.pink} size={20} />
        </button>
      </header>

      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: "none" }} />
      <input ref={galRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />

      <div style={{ padding: "10px 16px 0" }}>
        {!pet ? (
          <Empty text="Add a pet first to start a memory journal." action={() => router.push("/pet-profile/new")} actionLabel="Add Pet" />
        ) : memories.length === 0 ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: "28px 20px", textAlign: "center", boxShadow: T.shadowSoft }}>
            <div className="pawzo-bob" style={{ fontSize: 46, marginBottom: 10 }}>📷</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>No memories yet</p>
            <p style={{ fontSize: 13, color: T.gray, margin: "4px 0 16px" }}>Snap a photo of {pet.name} to begin.</p>
            <button onClick={() => camRef.current?.click()} className="pawzo-press" style={{ background: T.pink, color: "#fff", border: "none", borderRadius: 14, padding: "12px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Open camera</button>
          </div>
        ) : (
          <>
            {busy && <p style={{ fontSize: 12, color: T.gray, textAlign: "center", marginBottom: 10 }}>Saving photo…</p>}
            {dates.map((d) => (
              <div key={d} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: T.gray, margin: "0 2px 8px" }}>{d === todayISO() ? "Today" : fmtDate(d)}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {groups[d].map((m) => (
                    <div key={m.id} style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "1", background: "var(--p-surface-2)", boxShadow: T.shadowSoft }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.photo} alt={m.caption || "Memory"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => remove("memories", m.id)} aria-label="Delete" style={{ position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}

function Empty({ text, action, actionLabel }: { text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: "28px 20px", textAlign: "center", boxShadow: T.shadowSoft }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🐾</div>
      <p style={{ fontSize: 13.5, color: T.gray, marginBottom: action ? 14 : 0 }}>{text}</p>
      {action && <button onClick={action} className="pawzo-press" style={{ background: T.pink, color: "#fff", border: "none", borderRadius: 14, padding: "11px 20px", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>{actionLabel}</button>}
    </div>
  );
}
