"use client";

/* PAWZO Growth — weight logging, trend chart, AI weight analysis, milestones with confetti. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle, AiDisclaimer } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate } from "../../lib/store";
import { weightAnalysisApi, type ApiWeightAnalysis } from "../../lib/api";

export default function GrowthPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, remove } = usePawzo();

  // Weight form
  const [wtOpen, setWtOpen]   = useState(false);
  const [wWeight, setWWeight] = useState("");
  const [wDate, setWDate]     = useState(todayISO());
  const [wNote, setWNote]     = useState("");
  const [wUnit, setWUnit]     = useState<"kg" | "g" | "lb" | "oz">("kg");

  // AI analysis
  const [analysis, setAnalysis]           = useState<ApiWeightAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Weight log list
  const [logsOpen, setLogsOpen] = useState(false);

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const isMetric  = state.settings.units !== "imperial";
  const unit      = wUnit; // wUnit drives all display
  const unitOpts  = isMetric ? ["kg", "g"] as const : ["lb", "oz"] as const;

  function toDisplay(kg: number): number {
    if (wUnit === "g")  return +(kg * 1000).toFixed(1);
    if (wUnit === "lb") return +(kg * 2.205).toFixed(2);
    if (wUnit === "oz") return +(kg * 35.274).toFixed(1);
    return +kg.toFixed(3);
  }

  // Convert entered value to kg for storage
  function toKg(val: number, u: typeof wUnit): number {
    if (u === "g")  return +(val / 1000).toFixed(4);
    if (u === "lb") return +(val / 2.205).toFixed(4);
    if (u === "oz") return +(val / 35.274).toFixed(4);
    return val; // kg
  }

  const weights = state.weights.filter((w) => w.petId === pet.id).sort((a, b) => a.date.localeCompare(b.date));
  const first = weights[0]?.weight, last = weights[weights.length - 1]?.weight;
  const displayDelta = first != null && last != null ? toDisplay(last) - toDisplay(first) : null;

  function saveWeight() {
    const val = Number(wWeight);
    if (!val || val <= 0) return;
    add("weights", { petId: pet!.id, weight: toKg(val, wUnit), date: wDate, note: wNote.trim() });
    setWWeight(""); setWNote(""); setWDate(todayISO()); setWtOpen(false);
    setAnalysis(null);
  }

  async function loadAnalysis() {
    setAnalysisLoading(true);
    try {
      const logs = weights.map((w) => ({ date: w.date, weight: w.weight }));
      const res = await weightAnalysisApi.analyze(pet!.id, logs);
      setAnalysis(res);
    } catch {
      // silent fail
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <AppFrame>
      <TopBar title="Growth" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          <Stat label="Current weight" value={last != null ? `${toDisplay(last)} ${unit}` : "—"} delta={displayDelta != null ? `${displayDelta >= 0 ? "+" : ""}${displayDelta.toFixed(1)} ${unit} total` : "Log weight to track"} />
          <Stat label="Weight logs" value={String(weights.length)} delta="entries" />
        </div>

        {/* Weight section */}
        <SectionTitle action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={wUnit}
              onChange={(e) => { setWUnit(e.target.value as typeof wUnit); setWWeight(""); }}
              onClick={(e) => e.stopPropagation()}
              style={{ border: "1px solid #FBD0E4", background: T.primarySoft, borderRadius: 10, padding: "4px 8px", fontSize: 12, fontWeight: 700, color: T.pinkDeep, cursor: "pointer", outline: "none" }}
            >
              {unitOpts.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={() => setWtOpen((o) => !o)} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 4, background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}>
              <IconPlus color={T.pinkDeep} size={13} /> Log weight
            </button>
          </div>
        }>Weight</SectionTitle>

        {wtOpen && (
          <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: T.gray, display: "block", marginBottom: 4 }}>Weight ({wUnit}) *</label>
                <input style={inputStyle} type="number" step={wUnit === "g" || wUnit === "oz" ? "1" : "0.1"} min="0" placeholder={wUnit === "g" ? "85" : wUnit === "oz" ? "3" : "12.5"} value={wWeight} onChange={(e) => setWWeight(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: T.gray, display: "block", marginBottom: 4 }}>Date</label>
                <input style={inputStyle} type="date" max={todayISO()} value={wDate} onChange={(e) => setWDate(e.target.value)} />
              </div>
            </div>
            <input style={inputStyle} placeholder="Note (optional)" value={wNote} onChange={(e) => setWNote(e.target.value)} />
            <div style={{ display: "flex", gap: 10 }}>
              <GhostButton full onClick={() => setWtOpen(false)}>Cancel</GhostButton>
              <PrimaryButton full onClick={saveWeight}>Save</PrimaryButton>
            </div>
          </div>
        )}


        <div style={{ background: "#BCF4F5", borderRadius: 18, padding: 16 }}>
          {weights.length >= 2 ? (
            <Trend rawKg={weights.map((w) => w.weight)} dates={weights.map((w) => w.date)} displayUnit={wUnit} />
          ) : (
            <p style={{ fontSize: 13, color: "#175676", textAlign: "center", padding: "8px 0" }}>
              {weights.length === 0 ? `Tap "Log weight" to start tracking ${pet.name}'s growth. 📈` : "Log one more entry to see the growth curve. 📈"}
            </p>
          )}
        </div>

        {/* Weight log list — collapsible */}
        {weights.length > 0 && (
          <>
            <button onClick={() => setLogsOpen((o) => !o)} className="pawzo-press" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "var(--p-surface)", border: "none", borderRadius: 12, padding: "9px 14px", cursor: "pointer", boxShadow: T.shadowSoft }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.gray }}>📋 {weights.length} log{weights.length !== 1 ? "s" : ""}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: logsOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {logsOpen && (
              <div className="pawzo-rise" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...weights].reverse().map((w) => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--p-surface)", borderRadius: 12, padding: "9px 12px", boxShadow: T.shadowSoft }}>
                    <span style={{ fontSize: 15 }}>⚖️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{toDisplay(w.weight)} {unit}</p>
                      <p style={{ fontSize: 11, color: T.grayLight }}>{fmtDate(w.date)}{w.note ? ` · ${w.note}` : ""}</p>
                    </div>
                    <button onClick={() => remove("weights", w.id)} aria-label="Delete" className="pawzo-press" style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* AI Weight Analysis */}
        {weights.length > 0 && (
          <>
            <SectionTitle>AI Weight Analysis</SectionTitle>

            {!analysis && !analysisLoading && (
              <button onClick={loadAnalysis} className="pawzo-press" style={{ width: "100%", background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 4 }}>
                <span style={{ fontSize: 26 }}>🤖</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0F766E" }}>Analyse {pet.name}&apos;s weight</p>
                  <p style={{ fontSize: 11.5, color: "#134E4A" }}>AI ideal range comparison for {pet.species}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}

            {analysisLoading && (
              <div style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 18, padding: 16, textAlign: "center", marginBottom: 4 }}>
                <p style={{ fontSize: 13, color: "#0F766E" }}>Analysing {pet.name}&apos;s weight…</p>
              </div>
            )}

            {analysis && (
              <div className="pawzo-rise" style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 18, padding: 16, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#0F766E" }}>🤖 AI Weight Analysis</p>
                  <button onClick={() => setAnalysis(null)} style={{ background: "none", border: "none", color: "#0F766E", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0 }}>Reset</button>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#134E4A", letterSpacing: 0.7, marginBottom: 4 }}>IDEAL RANGE</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#0F766E" }}>{analysis.ideal_min}–{analysis.ideal_max} kg</p>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#134E4A", letterSpacing: 0.7, marginBottom: 4 }}>GOAL</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: analysis.goal === "maintain" ? "#059669" : analysis.goal === "gain" ? "#D97706" : "#DC2626" }}>
                      {analysis.goal === "maintain" ? "✅ Maintain" : analysis.goal === "gain" ? `📈 Gain ${analysis.goal_amount} kg` : `📉 Lose ${analysis.goal_amount} kg`}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: "#134E4A", lineHeight: 1.5 }}>{analysis.message}</p>
                {/* Trend card */}
                {analysis.trend_message && (() => {
                  const isWarning = analysis.trend_status === "warning";
                  const isCaution = analysis.trend_status === "caution";
                  const bg      = isWarning ? "#FFF1F2" : isCaution ? "#FFFBEB" : "#F0FDF4";
                  const border  = isWarning ? "#FECDD3" : isCaution ? "#FDE68A" : "#BBF7D0";
                  const color   = isWarning ? "#BE123C"  : isCaution ? "#92400E" : "#15803D";
                  return (
                    <div style={{ marginTop: 10, background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: "10px 12px" }}>
                      <p style={{ fontSize: 12, color, lineHeight: 1.5, fontWeight: 600 }}>{analysis.trend_message}</p>
                    </div>
                  );
                })()}
                <AiDisclaimer />
              </div>
            )}
          </>
        )}

      </div>

      <BottomNav />
    </AppFrame>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div style={{ flex: 1, background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft }}>
      <p style={{ fontSize: 11.5, color: T.grayLight, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: "2px 0" }}>{value}</p>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.gray }}>{delta}</span>
    </div>
  );
}

function niceStep(maxVal: number, targetTicks = 5): number {
  const rough = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return nice * mag;
}

function Trend({ rawKg, dates, displayUnit }: { rawKg: number[]; dates: string[]; displayUnit: string }) {
  const toUnit = (kg: number) => {
    if (displayUnit === "g")  return kg * 1000;
    if (displayUnit === "lb") return +(kg * 2.205).toFixed(3);
    if (displayUnit === "oz") return +(kg * 35.274).toFixed(2);
    return kg;
  };
  const data = rawKg.map(toUnit);

  const w = 300, h = 140, padL = 36, padR = 8, padT = 8, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxVal = Math.max(...data, 0);
  const step   = niceStep(maxVal || 1);
  const yMax   = Math.ceil(maxVal / step) * step || step;

  const pts = data.map((v, i) => [
    padL + (i * plotW) / Math.max(1, data.length - 1),
    padT + plotH - (v / yMax) * plotH,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const labelIdx = data.length <= 2 ? [0, data.length - 1] : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  // y ticks from 0 to yMax
  const ticks: number[] = [];
  for (let t = 0; t <= yMax + step * 0.01; t = +(t + step).toFixed(10)) ticks.push(t);

  const fmtVal = (v: number) => {
    if (displayUnit === "g" || displayUnit === "oz") return String(Math.round(v));
    return v % 1 === 0 ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {ticks.map((v) => {
        const y = padT + plotH - (v / yMax) * plotH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#4BA3C3" strokeWidth="0.5" opacity="0.25" />
            <line x1={padL - 3} y1={y} x2={padL} y2={y} stroke="#4BA3C3" strokeWidth="1" opacity="0.5" />
            <text x={padL - 5} y={y + 3} fontSize="7" fill="#4BA3C3" textAnchor="end">{fmtVal(v)}{displayUnit}</text>
          </g>
        );
      })}
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#4BA3C3" strokeWidth="1" opacity="0.3" />
      <line x1={padL} y1={padT + plotH} x2={w - padR} y2={padT + plotH} stroke="#4BA3C3" strokeWidth="1" opacity="0.3" />
      <path d={path + ` L${pts[pts.length - 1][0].toFixed(1)} ${padT + plotH} L${padL} ${padT + plotH} Z`} fill="#175676" fillOpacity="0.1" />
      <path d={path} fill="none" stroke="#175676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 3} fill="#BA324F" />)}
      {labelIdx.filter((i) => i < dates.length).map((i, pos) => {
        const anchor = pos === 0 ? "start" : pos === labelIdx.length - 1 ? "end" : "middle";
        return (
          <text key={i} x={pts[i][0]} y={h - 4} fontSize="7.5" fill="#4BA3C3" textAnchor={anchor}>
            {new Date(dates[i] + "T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </text>
        );
      })}
    </svg>
  );
}
