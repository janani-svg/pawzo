"use client";

/* PAWZO Growth — weight trend from real logs + user-created milestones (CRUD).
   No sample data. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate } from "../../lib/store";

const EMOJIS = ["🦴", "💉", "🐕", "🎂", "🏆", "🛁", "🎾", "🌱", "⭐", "❤️"];

export default function GrowthPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, remove } = usePawzo();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("🦴");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const unit = state.settings.units === "metric" ? "kg" : "lb";
  const toDisplay = (kg: number) => state.settings.units === "imperial" ? +(kg * 2.205).toFixed(1) : kg;

  const weights = state.weights.filter((w) => w.petId === pet.id).sort((a, b) => a.date.localeCompare(b.date));
  const milestones = state.milestones.filter((m) => m.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const first = weights[0]?.weight, last = weights[weights.length - 1]?.weight;
  const displayDelta = first != null && last != null ? toDisplay(last) - toDisplay(first) : null;

  function save() {
    if (!title.trim()) return;
    add("milestones", { petId: pet!.id, emoji, title: title.trim(), date });
    setTitle(""); setDate(todayISO()); setEmoji("🦴"); setOpen(false);
  }

  return (
    <AppFrame>
      <TopBar title="Growth" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          <Stat label="Current weight" value={last != null ? `${toDisplay(last)} ${unit}` : "—"} delta={displayDelta != null ? `${displayDelta >= 0 ? "+" : ""}${displayDelta.toFixed(1)} ${unit} total` : "Log weight to track"} />
          <Stat label="Logs" value={String(weights.length)} delta="weight entries" />
        </div>

        <SectionTitle action={<span style={{ fontSize: 11.5, fontWeight: 700, color: T.grayLight }}>From health logs</span>}>Weight over time</SectionTitle>
        <div style={{ background: "#BCF4F5", borderRadius: 18, padding: 16 }}>
          {weights.length >= 2 ? (
            <Trend data={weights.map((w) => toDisplay(w.weight))} dates={weights.map((w) => w.date)} unit={unit} />
          ) : (
            <p style={{ fontSize: 13, color: "#175676", textAlign: "center", padding: "8px 0" }}>Log at least two weights in Health to see the growth curve. 📈</p>
          )}
        </div>

        <SectionTitle action={<button onClick={() => setOpen((o) => !o)} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 4, background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}><IconPlus color={T.pinkDeep} size={13} /> Add</button>}>
          Milestones
        </SectionTitle>

        {open && (
          <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: `2px solid ${emoji === e ? T.pink : "transparent"}`, background: emoji === e ? T.primarySoft : "var(--p-surface-2)", fontSize: 20, cursor: "pointer" }}>{e}</button>
              ))}
            </div>
            <input style={inputStyle} placeholder="Milestone (e.g. First swim)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input style={inputStyle} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            <div style={{ display: "flex", gap: 10 }}><GhostButton full onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton full onClick={save}>Save</PrimaryButton></div>
          </div>
        )}

        {milestones.length === 0 && !open ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 20, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>No milestones yet. Capture {pet.name}&apos;s big moments!</div>
        ) : (
          <div style={{ position: "relative" }}>
            {milestones.map((m, i) => (
              <div key={m.id} style={{ display: "flex", gap: 12, paddingBottom: i === milestones.length - 1 ? 0 : 16, position: "relative" }}>
                {i !== milestones.length - 1 && <div style={{ position: "absolute", left: 18, top: 38, bottom: 0, width: 2, background: "var(--p-border)" }} />}
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: T.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, zIndex: 1 }}>{m.emoji}</div>
                <div style={{ flex: 1, background: "var(--p-surface)", borderRadius: 14, padding: "10px 14px", boxShadow: T.shadowSoft, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{m.title}</p>
                    <p style={{ fontSize: 11.5, color: T.grayLight }}>{fmtDate(m.date)}</p>
                  </div>
                  <button onClick={() => remove("milestones", m.id)} aria-label="Delete" className="pawzo-press" style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div style={{ flex: 1, background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft }}>
      <p style={{ fontSize: 11.5, color: T.grayLight, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: "2px 0" }}>{value}</p>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.gray }}>{delta}</span>
    </div>
  );
}
function Trend({ data, dates, unit }: { data: number[]; dates: string[]; unit: string }) {
  const w = 300, h = 140, padL = 32, padR = 8, padT = 8, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => [
    padL + (i * plotW) / Math.max(1, data.length - 1),
    padT + plotH - ((v - min) / range) * plotH,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const labelIdx = data.length <= 2
    ? [0, data.length - 1]
    : [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const yTicks = [min, (min + max) / 2, max];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* y-axis ticks */}
      {yTicks.map((v, i) => {
        const y = padT + plotH - ((v - min) / range) * plotH;
        return (
          <g key={i}>
            <line x1={padL - 3} y1={y} x2={padL} y2={y} stroke="#4BA3C3" strokeWidth="1" opacity="0.5" />
            <text x={padL - 5} y={y + 3} fontSize="7" fill="#4BA3C3" textAnchor="end">{v.toFixed(1)} {unit}</text>
          </g>
        );
      })}
      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#4BA3C3" strokeWidth="1" opacity="0.3" />
      <line x1={padL} y1={padT + plotH} x2={w - padR} y2={padT + plotH} stroke="#4BA3C3" strokeWidth="1" opacity="0.3" />
      {/* area fill */}
      <path
        d={path + ` L${pts[pts.length - 1][0].toFixed(1)} ${padT + plotH} L${padL} ${padT + plotH} Z`}
        fill="#175676"
        fillOpacity="0.1"
      />
      {/* line */}
      <path d={path} fill="none" stroke="#175676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 3} fill="#BA324F" />
      ))}
      {/* x-axis date labels */}
      {labelIdx.filter((i) => i < dates.length).map((i) => (
        <text key={i} x={pts[i][0]} y={h - 4} fontSize="7.5" fill="#4BA3C3" textAnchor="middle">
          {new Date(dates[i] + "T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" })}
        </text>
      ))}
    </svg>
  );
}
