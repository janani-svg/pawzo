"use client";

/* PAWZO Emergency — preferred veterinarian only (no separate contacts list).
   A large card shows the vet's name & phone with one-tap calling. Users can
   add, update or delete the vet. Phone fields accept digits only and are
   validated. No location-based discovery in this scope. */

import { useState } from "react";
import { AppFrame, BottomNav, TopBar, PrimaryButton, GhostButton, Field, T, IconPhone, IconPlus } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, type Vet } from "../lib/store";

const phoneOk = (p: string) => { const d = p.replace(/\D/g, ""); return d.length >= 7 && d.length <= 15; };
const onlyPhone = (s: string) => s.replace(/[^\d+\-\s()]/g, "");

export default function EmergencyPage() {
  const { ready, authed } = useRequireAuth();
  const { state, setVet } = usePawzo();
  const [editing, setEditing] = useState(false);

  if (!ready || !authed) return null;
  const vet = state.vet;

  return (
    <AppFrame bg="#FFF6F6">
      <TopBar title="Emergency" back="/dashboard" />

      <div style={{ padding: "8px 16px 0" }}>
        {/* big emergency card */}
        <div style={{ background: T.danger, borderRadius: 22, padding: 20, color: "#fff", boxShadow: "0 10px 24px rgba(212,24,61,0.3)" }}>
          <p style={{ fontSize: 17, fontWeight: 800 }}>In an emergency, stay calm 💗</p>
          {vet ? (
            <>
              <p style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>Your preferred vet</p>
              <p style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{vet.name || vet.clinic}</p>
              {vet.clinic && vet.name && <p style={{ fontSize: 13, opacity: 0.9 }}>{vet.clinic}</p>}
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{vet.phone}</p>
              <a href={`tel:${vet.phone.replace(/[^\d+]/g, "")}`} style={{ textDecoration: "none" }}>
                <div className="pawzo-press" style={{ marginTop: 14, background: "#fff", color: T.danger, borderRadius: 14, padding: "13px", textAlign: "center", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <IconPhone color={T.danger} size={18} /> Call vet now
                </div>
              </a>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, opacity: 0.95, marginTop: 6, lineHeight: 1.5 }}>Add your preferred veterinarian so help is one tap away.</p>
              <button onClick={() => setEditing(true)} className="pawzo-press" style={{ marginTop: 14, background: "#fff", color: T.danger, border: "none", borderRadius: 14, padding: "12px 18px", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconPlus color={T.danger} size={16} /> Add veterinarian
              </button>
            </>
          )}
        </div>

        {/* vet management */}
        {(vet || editing) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 2px 10px" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>Veterinarian</h2>
              {vet && !editing && (
                <button onClick={() => setEditing(true)} className="pawzo-press" style={chip}>Edit</button>
              )}
            </div>

            {editing ? (
              <VetForm initial={vet} onCancel={() => setEditing(false)} onSave={(v) => { setVet(v); setEditing(false); }} />
            ) : vet ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: T.shadowSoft }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{vet.name || vet.clinic}</p>
                    {vet.address && <p style={{ fontSize: 11.5, color: T.grayLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {vet.address}</p>}
                  </div>
                  <a href={`tel:${vet.phone.replace(/[^\d+]/g, "")}`} className="pawzo-press" style={callBtn} aria-label="Call vet"><IconPhone color="#fff" size={18} /></a>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3ECF7", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, color: T.gray }}>📞 {vet.phone}</span>
                  {vet.altPhone && <span style={{ fontSize: 12.5, color: T.gray }}>↪ {vet.altPhone}</span>}
                </div>
                <button onClick={() => { if (confirm("Delete this veterinarian?")) setVet(null); }} className="pawzo-press" style={{ width: "100%", marginTop: 12, background: T.dangerBg, color: T.danger, border: "none", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  Delete veterinarian
                </button>
              </div>
            ) : null}
          </div>
        )}

        <p style={{ fontSize: 11, color: T.grayLight, textAlign: "center", margin: "16px 8px 0", lineHeight: 1.5 }}>
          Pawzo keeps your trusted vet handy. Nearby-vet discovery may arrive in a future update.
        </p>
      </div>

      <BottomNav />
    </AppFrame>
  );
}

function VetForm({ initial, onSave, onCancel }: { initial: Vet; onSave: (v: Vet) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [clinic, setClinic] = useState(initial?.clinic ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [altPhone, setAltPhone] = useState(initial?.altPhone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [err, setErr] = useState("");

  function save() {
    if (!name.trim() && !clinic.trim()) { setErr("Add a vet or clinic name."); return; }
    if (!phoneOk(phone)) { setErr("Enter a valid phone number (7–15 digits)."); return; }
    if (altPhone && !phoneOk(altPhone)) { setErr("Alternate phone looks invalid."); return; }
    onSave({ name: name.trim(), clinic: clinic.trim(), phone: phone.trim(), altPhone: altPhone.trim(), address: address.trim() });
  }

  return (
    <div className="pawzo-rise" style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft }}>
      <Field label="Veterinarian name"><input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Mehta" /></Field>
      <Field label="Clinic name"><input style={inp} value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="Happy Paws Clinic" /></Field>
      <Field label="Phone number *">
        <input style={inp} type="tel" inputMode="tel" value={phone} onChange={(e) => { setPhone(onlyPhone(e.target.value)); setErr(""); }} placeholder="+1 555 0142" />
      </Field>
      <Field label="Alternate phone" hint="Optional">
        <input style={inp} type="tel" inputMode="tel" value={altPhone} onChange={(e) => { setAltPhone(onlyPhone(e.target.value)); setErr(""); }} placeholder="+1 555 0199" />
      </Field>
      <Field label="Address" hint="Optional"><input style={inp} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" /></Field>
      {err && <div style={{ background: T.dangerBg, color: T.danger, fontSize: 12, fontWeight: 600, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <GhostButton full onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton full onClick={save}>Save vet</PrimaryButton>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", height: 46, padding: "0 14px", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 14.5, outline: "none", color: T.ink };
const chip: React.CSSProperties = { background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" };
const callBtn: React.CSSProperties = { width: 44, height: 44, borderRadius: "50%", background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
