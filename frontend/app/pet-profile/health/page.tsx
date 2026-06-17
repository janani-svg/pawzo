"use client";

/* PAWZO Health & Wellness — real CRUD. Add vaccinations, log weights, and add
   vet consultations / medications. Only user-entered records are shown — no
   default vaccines or sample weights. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, Pill, T, IconPlus, inputStyle } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate, daysUntil } from "../../lib/store";

type Form = null | { kind: "vaccine" | "weight" | "vet" | "medication" };

export default function HealthPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, remove } = usePawzo();
  const [form, setForm] = useState<Form>(null);

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const vaccines = state.vaccinations.filter((v) => v.petId === pet.id).sort((a, b) => (a.nextDue || "").localeCompare(b.nextDue || ""));
  const weights = state.weights.filter((w) => w.petId === pet.id).sort((a, b) => a.date.localeCompare(b.date));
  const vets = state.health.filter((h) => h.petId === pet.id && h.kind === "vet").sort((a, b) => b.date.localeCompare(a.date));
  const meds = state.health.filter((h) => h.petId === pet.id && h.kind === "medication");
  const latest = weights[weights.length - 1]?.weight;

  return (
    <AppFrame>
      <TopBar title="Health" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
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

        {/* weight */}
        <SectionTitle action={<AddChip onClick={() => setForm({ kind: "weight" })} label="Log weight" />}>Weight matrix</SectionTitle>
        {form?.kind === "weight" && <WeightForm onCancel={() => setForm(null)} onSave={(d) => { add("weights", { ...d, petId: pet.id }); setForm(null); }} />}
        <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft }}>
          {weights.length === 0 ? (
            <p style={{ fontSize: 13, color: T.grayLight, textAlign: "center" }}>No weight logged yet. Tap “Log weight”.</p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>{latest}</span>
                <span style={{ fontSize: 13, color: T.gray, fontWeight: 600 }}>kg latest</span>
              </div>
              {weights.length >= 2 ? <WeightChart data={weights.map((w) => w.weight)} /> : <p style={{ fontSize: 12, color: T.grayLight }}>Log one more to see the trend chart.</p>}
            </>
          )}
        </div>

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
function WeightForm({ onSave, onCancel }: { onSave: (d: { weight: number; date: string; note: string }) => void; onCancel: () => void }) {
  const [weight, setWeight] = useState(""); const [date, setDate] = useState(todayISO()); const [note, setNote] = useState("");
  return (
    <FormCard>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Weight (kg) *"><input style={fi} type="number" step="0.1" min="0" placeholder="12.5" value={weight} onChange={(e) => setWeight(e.target.value)} /></Labeled>
        <Labeled label="Date"><input style={fi} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></Labeled>
      </div>
      <input style={fi} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Actions onCancel={onCancel} onSave={() => Number(weight) > 0 && onSave({ weight: Number(weight), date, note: note.trim() })} />
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
function WeightChart({ data }: { data: number[] }) {
  const w = 300, h = 90, pad = 6;
  const min = Math.min(...data) - 0.5, max = Math.max(...data) + 0.5;
  const pts = data.map((v, i) => [pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1), h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <path d={area} fill="rgba(236,72,153,0.12)" />
      <path d={path} fill="none" stroke="var(--p-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill="var(--p-primary)" />)}
    </svg>
  );
}
const fi: React.CSSProperties = { ...inputStyle };
