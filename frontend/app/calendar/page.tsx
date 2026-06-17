"use client";

/* PAWZO Calendar — real events across all the user's pets. Monthly grid with
   event dots, a selected-day list, an "upcoming" list, and add/delete. No AI
   or schedule sections. */

import { useState } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate } from "../lib/store";

const EMOJIS = ["📅", "🩺", "💉", "🍖", "🛁", "🚶", "🎂", "💊"];

export default function CalendarPage() {
  const { ready, authed } = useRequireAuth();
  const { state, myPets, add, remove } = usePawzo();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [sel, setSel] = useState(todayISO());
  const [open, setOpen] = useState(false);

  const pets = ready ? myPets() : [];
  if (!ready || !authed) return null;

  const events = state.events.filter((e) => pets.some((p) => p.id === e.petId));
  const eventsOn = (iso: string) => events.filter((e) => e.date === iso);
  const today = todayISO();
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  const first = new Date(cursor.y, cursor.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const iso = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const shift = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <AppFrame>
      <TopBar title="Calendar" back="/dashboard" right={<button onClick={() => setOpen((o) => !o)} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 4, background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}><IconPlus color={T.pinkDeep} size={13} /> Event</button>} />

      <div style={{ padding: "8px 16px 0" }}>
        {open && pets.length > 0 && <EventForm pets={pets} defaultDate={sel} onCancel={() => setOpen(false)} onSave={(e) => { add("events", e); setSel(e.date); setOpen(false); }} />}
        {open && pets.length === 0 && <div style={{ background: "var(--p-surface)", borderRadius: 14, padding: 16, textAlign: "center", color: T.grayLight, fontSize: 13, marginBottom: 12 }}>Add a pet first to create events.</div>}

        <div style={{ background: "var(--p-surface)", borderRadius: 20, padding: 16, boxShadow: T.shadowSoft }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => shift(-1)} className="pawzo-press" style={navBtn}>‹</button>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>{monthName}</h2>
            <button onClick={() => shift(1)} className="pawzo-press" style={navBtn}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.grayLight }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const dayIso = iso(d);
              const has = eventsOn(dayIso).length > 0;
              const active = dayIso === sel;
              const isToday = dayIso === today;
              return (
                <button key={i} onClick={() => setSel(dayIso)} style={{ aspectRatio: "1", borderRadius: 12, border: isToday && !active ? `1.5px solid ${T.pink}` : "none", cursor: "pointer", background: active ? T.pink : "transparent", color: active ? "#fff" : T.ink, fontSize: 13, fontWeight: active ? 800 : 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  {d}
                  {has && <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#fff" : T.pink, marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
        </div>

        <SectionTitle>{sel === today ? "Today" : fmtDate(sel)}</SectionTitle>
        <DayList items={eventsOn(sel)} pets={pets} onDelete={(id) => remove("events", id)} emptyText="Nothing planned — a perfect day for cuddles." />

        <SectionTitle>Upcoming</SectionTitle>
        <DayList items={upcoming} pets={pets} showDate onDelete={(id) => remove("events", id)} emptyText="No upcoming events yet." />
      </div>

      <BottomNav />
    </AppFrame>
  );
}

function DayList({ items, pets, showDate, onDelete, emptyText }: { items: { id: string; title: string; emoji: string; date: string; petId: string }[]; pets: { id: string; name: string }[]; showDate?: boolean; onDelete: (id: string) => void; emptyText: string }) {
  if (items.length === 0) return <div style={{ background: "var(--p-surface)", borderRadius: 14, padding: 18, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>{emptyText}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((e) => {
        const pet = pets.find((p) => p.id === e.petId);
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 14, padding: "12px 14px", boxShadow: T.shadowSoft }}>
            <span style={{ fontSize: 20 }}>{e.emoji || "📅"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{e.title}</span>
              <p style={{ fontSize: 11, color: T.grayLight }}>{pet?.name}{showDate ? ` · ${fmtDate(e.date)}` : ""}</p>
            </div>
            <button onClick={() => onDelete(e.id)} aria-label="Delete" className="pawzo-press" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EventForm({ pets, defaultDate, onSave, onCancel }: { pets: { id: string; name: string }[]; defaultDate: string; onSave: (e: { petId: string; title: string; date: string; emoji: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(defaultDate); const [emoji, setEmoji] = useState("📅"); const [petId, setPetId] = useState(pets[0]?.id ?? "");
  return (
    <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <input style={inputStyle} placeholder="Event (e.g. Vet appointment)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select style={{ ...inputStyle, fontWeight: 600 }} value={petId} onChange={(e) => setPetId(e.target.value)}>{pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {EMOJIS.map((e) => <button key={e} onClick={() => setEmoji(e)} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: `2px solid ${emoji === e ? T.pink : "transparent"}`, background: emoji === e ? T.primarySoft : "var(--p-surface-2)", fontSize: 20, cursor: "pointer" }}>{e}</button>)}
      </div>
      <div style={{ display: "flex", gap: 10 }}><GhostButton full onClick={onCancel}>Cancel</GhostButton><PrimaryButton full onClick={() => title.trim() && petId && onSave({ petId, title: title.trim(), date, emoji })}>Save</PrimaryButton></div>
    </div>
  );
}

const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 10, border: "none", background: "var(--p-surface-2)", color: T.ink, fontSize: 18, cursor: "pointer", lineHeight: 1 };
