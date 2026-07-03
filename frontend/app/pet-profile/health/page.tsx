"use client";

/* PAWZO Health & Wellness — real CRUD. Add vaccinations, log weights, and add
   vet consultations / medications. Only user-entered records are shown — no
   default vaccines or sample weights. */

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, Pill, T, IconPlus, inputStyle } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate, daysUntil } from "../../lib/store";
import type { Meal, MealLog } from "../../lib/store";

type Form = null | { kind: "vaccine" | "vet" | "medication" };

export default function HealthPage() {
  return (
    <Suspense fallback={null}>
      <HealthPageInner />
    </Suspense>
  );
}

function HealthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, remove, selectPet } = usePawzo();

  useEffect(() => {
    const petId = searchParams.get("petId");
    if (petId && ready) selectPet(petId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const [form, setForm] = useState<Form>(null);

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const vaccines = state.vaccinations.filter((v) => v.petId === pet.id).sort((a, b) => (a.nextDue || "").localeCompare(b.nextDue || ""));
  const vets = state.health.filter((h) => h.petId === pet.id && h.kind === "vet").sort((a, b) => b.date.localeCompare(a.date));
  const meds = state.health.filter((h) => h.petId === pet.id && h.kind === "medication");
  const petMeals = state.meals.filter((m) => m.petId === pet.id);
  const petMealLogs = state.mealLogs.filter((l) => l.petId === pet.id);

  return (
    <AppFrame>
      <TopBar title="Health" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        {/* nutrition chart */}
        <SectionTitle>Nutrition Chart</SectionTitle>
        <NutritionStatus meals={petMeals} mealLogs={petMealLogs} />

        {/* vaccinations */}
        <SectionTitle action={<AddChip onClick={() => setForm({ kind: "vaccine" })} label="Vaccination" />}>Vaccinations</SectionTitle>
        {form?.kind === "vaccine" && <VaccineForm onCancel={() => setForm(null)} onSave={(d) => { add("vaccinations", { ...d, petId: pet.id }); setForm(null); }} />}
        {vaccines.length === 0 && !form ? <Empty text="No vaccinations yet. Add your pet's records." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vaccines.map((v) => {
              const due = v.nextDue ? daysUntil(v.nextDue) : null;
              return (
                <Row key={v.id} icon="💉" title={v.name} sub={`${v.date ? "Given " + fmtDate(v.date) : ""}${v.nextDue ? " · Next " + fmtDate(v.nextDue) : ""}`} onDelete={() => remove("vaccinations", v.id)}>
                  {due !== null && (due <= 30 ? <Pill bg="#FEF3C7" color="#92400E" border="#FDE68A">{due < 0 ? "Overdue" : "Due"}</Pill> : <Pill bg="#DCFCE7" color="#166534">Done</Pill>)}
                </Row>
              );
            })}
          </div>
        )}

        {/* clinic ledger */}
        <SectionTitle>Health clinic ledger</SectionTitle>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <AddBlock emoji="🩺" label="Vet consult" onClick={() => setForm({ kind: "vet" })} />
          <AddBlock emoji="💊" label="Medication" onClick={() => setForm({ kind: "medication" })} />
        </div>
        {form?.kind === "vet" && <RecordForm title="Vet consultation" onCancel={() => setForm(null)} onSave={(d) => { add("health", { petId: pet.id, kind: "vet", title: d.title, detail: d.detail, date: d.date }); setForm(null); }} />}
        {form?.kind === "medication" && <RecordForm title="Medication" medication onCancel={() => setForm(null)} onSave={(d) => { add("health", { petId: pet.id, kind: "medication", title: d.title, detail: d.detail, date: d.date, active: true }); setForm(null); }} />}

        {vets.length > 0 && <p style={{ fontSize: 11, fontWeight: 700, color: T.grayLight, letterSpacing: 0.6, margin: "4px 2px 8px" }}>VET CONSULTATIONS</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vets.map((h) => <Row key={h.id} icon="🩺" title={h.title} sub={`${fmtDate(h.date)}${h.detail ? " · " + h.detail : ""}`} onDelete={() => remove("health", h.id)} />)}
        </div>

        {meds.length > 0 && <p style={{ fontSize: 11, fontWeight: 700, color: T.grayLight, letterSpacing: 0.6, margin: "12px 2px 8px" }}>MEDICATIONS</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {meds.map((h) => <Row key={h.id} icon="💊" title={h.title} sub={h.detail} onDelete={() => remove("health", h.id)}>{h.active && <Pill bg="#EFF6FF" color="#1E40AF">Active</Pill>}</Row>)}
        </div>
      </div>

      <BottomNav />
    </AppFrame>
  );
}

/* ---- forms ---- */
function VaccineForm({ onSave, onCancel }: { onSave: (d: { name: string; date: string; nextDue: string; clinic: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(todayISO()); const [nextDue, setNextDue] = useState(""); const [clinic, setClinic] = useState("");
  return (
    <FormCard>
      <input style={fi} placeholder="Vaccine name *" value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Date given"><input style={fi} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></Labeled>
        <Labeled label="Next due"><input style={fi} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Labeled>
      </div>
      <input style={fi} placeholder="Clinic (optional)" value={clinic} onChange={(e) => setClinic(e.target.value)} />
      <Actions onCancel={onCancel} onSave={() => name.trim() && onSave({ name: name.trim(), date, nextDue, clinic: clinic.trim() })} />
    </FormCard>
  );
}
function RecordForm({ title, medication, onSave, onCancel }: { title: string; medication?: boolean; onSave: (d: { title: string; detail: string; date: string }) => void; onCancel: () => void }) {
  const [t, setT] = useState(""); const [detail, setDetail] = useState(""); const [date, setDate] = useState(todayISO());
  return (
    <FormCard>
      <p style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, marginBottom: 2 }}>{title}</p>
      <input style={fi} placeholder={medication ? "Medication name *" : "Reason / title *"} value={t} onChange={(e) => setT(e.target.value)} />
      <input style={fi} placeholder={medication ? "Dosage & frequency" : "Diagnosis / notes"} value={detail} onChange={(e) => setDetail(e.target.value)} />
      <Labeled label="Date"><input style={fi} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></Labeled>
      <Actions onCancel={onCancel} onSave={() => t.trim() && onSave({ title: t.trim(), detail: detail.trim(), date })} />
    </FormCard>
  );
}

/* ---- shared bits ---- */
function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>;
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: T.gray }}>{label}<div style={{ marginTop: 4 }}>{children}</div></label>;
}
function Actions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div style={{ display: "flex", gap: 10, marginTop: 2 }}><GhostButton full onClick={onCancel}>Cancel</GhostButton><PrimaryButton full onClick={onSave}>Save</PrimaryButton></div>;
}
function Row({ icon, title, sub, children, onDelete }: { icon: string; title: string; sub?: string; children?: React.ReactNode; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--p-surface)", borderRadius: 14, padding: "12px 14px", boxShadow: T.shadowSoft }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{title}</p>
        {sub && <p style={{ fontSize: 11.5, color: T.grayLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</p>}
      </div>
      {children}
      <button onClick={onDelete} aria-label="Delete" className="pawzo-press" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
      </button>
    </div>
  );
}
function AddChip({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 4, background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}><IconPlus color={T.pinkDeep} size={13} /> {label}</button>;
}
function AddBlock({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="pawzo-press" style={{ flex: 1, background: "var(--p-surface)", border: "1.5px dashed #E0D2F5", borderRadius: 16, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}><span style={{ fontSize: 22 }}>{emoji}</span><span style={{ fontSize: 11, fontWeight: 700, color: T.gray }}>{label}</span></button>;
}
function Empty({ text }: { text: string }) {
  return <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 18, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft, marginBottom: 4 }}>{text}</div>;
}
const fi: React.CSSProperties = { ...inputStyle };

const MACRO_COLORS = { protein: "#EC4899", fat: "#F59E0B", carbs: "#34D399", fiber: "#A78BFA" };

function estimateMacros(name: string, food: string): { protein: number; fat: number; carbs: number; fiber: number } {
  const t = `${name} ${food}`.toLowerCase();
  if (/chicken|beef|fish|salmon|tuna|turkey|lamb|duck|egg|pork|meat|venison|rabbit|shrimp/.test(t))
    return { protein: 47, fat: 33, carbs: 14, fiber: 6 };
  if (/oil|fat|butter|cream|cheese|bacon/.test(t))
    return { protein: 5, fat: 82, carbs: 9, fiber: 4 };
  if (/rice|pasta|bread|oat|wheat|corn|grain|potato|pea|lentil|quinoa/.test(t))
    return { protein: 9, fat: 4, carbs: 76, fiber: 11 };
  if (/carrot|broccoli|spinach|kale|apple|blueberry|banana|pumpkin|vegetable|veg|fruit/.test(t))
    return { protein: 7, fat: 2, carbs: 73, fiber: 18 };
  if (/treat|snack|biscuit|cookie|jerky|chew/.test(t))
    return { protein: 18, fat: 28, carbs: 44, fiber: 10 };
  if (/kibble|dry|pellet|royal.?canin|hills|science|purina|acana|orijen/.test(t))
    return { protein: 26, fat: 13, carbs: 52, fiber: 9 };
  if (/wet|canned|can|pate|pouche/.test(t))
    return { protein: 37, fat: 27, carbs: 27, fiber: 9 };
  return { protein: 28, fat: 18, carbs: 44, fiber: 10 };
}

function NutritionStatus({ meals, mealLogs }: { meals: Meal[]; mealLogs: MealLog[] }) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const minDate = sevenDaysAgo.toISOString().split("T")[0];
  const fedLogs = mealLogs.filter((l) => l.date >= minDate && l.done);

  if (meals.length === 0) {
    return <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 18, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>Add meals in the Food page to see nutrition status.</div>;
  }
  if (fedLogs.length === 0) {
    return <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 18, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>No meals logged in the last 7 days — use the Food page to track feedings.</div>;
  }

  let totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0, totalKcal = 0;
  fedLogs.forEach((log) => {
    const meal = meals.find((m) => m.id === log.mealId);
    if (!meal) return;
    const kcal = meal.kcal || 100;
    const macros = estimateMacros(meal.name, meal.food);
    totalProtein += kcal * macros.protein / 100;
    totalFat     += kcal * macros.fat     / 100;
    totalCarbs   += kcal * macros.carbs   / 100;
    totalFiber   += kcal * macros.fiber   / 100;
    totalKcal    += meal.kcal || 0;
  });

  const grandTotal = totalProtein + totalFat + totalCarbs + totalFiber || 1;
  const pPct = Math.round((totalProtein / grandTotal) * 100);
  const fPct = Math.round((totalFat     / grandTotal) * 100);
  const cPct = Math.round((totalCarbs   / grandTotal) * 100);
  const fiPct = 100 - pPct - fPct - cPct;
  const avgKcal = Math.round(totalKcal / 7);

  const slices = [
    { key: "protein", val: totalProtein, pct: pPct,  color: MACRO_COLORS.protein, label: "Protein" },
    { key: "fat",     val: totalFat,     pct: fPct,  color: MACRO_COLORS.fat,     label: "Fats"    },
    { key: "carbs",   val: totalCarbs,   pct: cPct,  color: MACRO_COLORS.carbs,   label: "Carbs"   },
    { key: "fiber",   val: totalFiber,   pct: fiPct, color: MACRO_COLORS.fiber,   label: "Fiber"   },
  ];

  const cx = 70, cy = 70, R = 60, ir = 38;
  let a = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const sweep = (s.val / grandTotal) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(a),  y1 = cy + R * Math.sin(a);
    const end = a + sweep;
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const ix1 = cx + ir * Math.cos(end), iy1 = cy + ir * Math.sin(end);
    const ix2 = cx + ir * Math.cos(a),   iy2 = cy + ir * Math.sin(a);
    const lg = sweep > Math.PI ? 1 : 0;
    const pathD = `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${ix1.toFixed(1)} ${iy1.toFixed(1)} A${ir} ${ir} 0 ${lg} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z`;
    a = end;
    return { ...s, pathD };
  });

  return (
    <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg viewBox="0 0 140 140" style={{ width: 130, height: 130, flexShrink: 0 }}>
          {arcs.map((arc) => <path key={arc.key} d={arc.pathD} fill={arc.color} />)}
          {avgKcal > 0
            ? <>
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--p-ink)">{avgKcal}</text>
                <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7.5" fontWeight="600" fill={T.gray}>kcal / day</text>
              </>
            : <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill={T.gray}>nutrition</text>
          }
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {slices.map((s) => (
            <div key={s.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: s.color }}>{s.pct}%</span>
              </div>
              <div style={{ height: 5, background: "var(--p-border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 10.5, color: T.grayLight, margin: "2px 0 0" }}>
            {fedLogs.length} meal{fedLogs.length !== 1 ? "s" : ""} fed · last 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
