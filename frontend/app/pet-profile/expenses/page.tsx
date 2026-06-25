"use client";

/* PAWZO Expenses — real CRUD. Add expenses (category, date, amount, optional
   bill image). The "Scan receipt" button runs in-browser OCR (tesseract.js) to
   auto-fill amount & date. "See all" reveals the full receipt history. No demo
   data; the distribution is computed from real entries. */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate, fileToDataURL, getCurrencySymbol } from "../../lib/store";
import { scanReceipt } from "../../lib/ocr";

const CATEGORIES = ["Food", "Veterinary", "Medication", "Grooming", "Supplies", "Training", "Emergency", "Other"];
const CAT_COLOR: Record<string, string> = { Food: "#F59E0B", Veterinary: "#3B82F6", Medication: "#EC4899", Grooming: "#10B981", Supplies: "#8B5CF6", Training: "#0EA5E9", Emergency: "#EF4444", Other: "#6B7280" };

export default function ExpensesPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, remove } = usePawzo();
  const sym = getCurrencySymbol(state.settings.currency);
  const [open, setOpen] = useState(false);
  const [seeAll, setSeeAll] = useState(false);

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const expenses = state.expenses.filter((e) => e.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = CATEGORIES.map((c) => ({ cat: c, amount: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const visible = seeAll ? expenses : expenses.slice(0, 3);

  return (
    <AppFrame>
      <TopBar title="Expenses" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ background: T.pink, borderRadius: 20, padding: 18, color: "#fff", boxShadow: "0 8px 20px rgba(217,79,138,0.25)" }}>
          <p style={{ fontSize: 12.5, opacity: 0.9, fontWeight: 600 }}>Total tracked</p>
          <p style={{ fontSize: 32, fontWeight: 800, margin: "2px 0 0" }}>{sym}{total.toFixed(2)}</p>
          <p style={{ fontSize: 11.5, opacity: 0.9 }}>{expenses.length} {expenses.length === 1 ? "entry" : "entries"} · {pet.name}</p>
        </div>

        <div style={{ margin: "12px 0" }}>
          <PrimaryButton full onClick={() => setOpen((o) => !o)}><IconPlus color="#fff" size={16} /> Add expense</PrimaryButton>
        </div>

        {open && <ExpenseForm petId={pet.id} onAdd={(e) => { add("expenses", e); setOpen(false); }} onCancel={() => setOpen(false)} />}

        {byCat.length > 0 && (
          <>
            <SectionTitle>Cost distribution</SectionTitle>
            <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, display: "flex", flexDirection: "column", gap: 12 }}>
              {byCat.map((c) => {
                const pct = Math.round((c.amount / total) * 100);
                return (
                  <div key={c.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{c.cat}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: CAT_COLOR[c.cat] }}>{sym}{c.amount.toFixed(2)} · {pct}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 6, background: "var(--p-surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: CAT_COLOR[c.cat], transition: "width 600ms" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <SectionTitle action={expenses.length > 3 ? <button onClick={() => setSeeAll((s) => !s)} style={{ background: "none", border: "none", fontSize: 11.5, fontWeight: 700, color: T.pink, cursor: "pointer" }}>{seeAll ? "Show less" : "See all"}</button> : undefined}>
          Recent invoices / receipts
        </SectionTitle>
        {expenses.length === 0 ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 20, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>No expenses yet. Add one to start tracking.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 14, padding: "12px 14px", boxShadow: T.shadowSoft }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--p-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {e.receipt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.receipt} alt="Receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : <span style={{ fontSize: 18 }}>🧾</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.category}{e.note ? ` · ${e.note}` : ""}</p>
                  <p style={{ fontSize: 11.5, color: T.grayLight }}>{fmtDate(e.date)}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{sym}{e.amount.toFixed(2)}</span>
                <button onClick={() => remove("expenses", e.id)} aria-label="Delete" className="pawzo-press" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}

function ExpenseForm({ petId, onAdd, onCancel }: { petId: string; onAdd: (e: { petId: string; category: string; amount: number; date: string; note: string; receipt: string }) => void; onCancel: () => void }) {
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataURL(f, 1400);
    setReceipt(url);
    setScanning(true); setScanMsg("Scanning receipt with AI…");
    try {
      const r = await scanReceipt(url);
      if (r.amount) setAmount(String(r.amount));
      if (r.date) setDate(r.date);
      setScanMsg(r.amount || r.date ? "Auto-filled from receipt ✓ Please confirm." : "Couldn't read it — enter details manually.");
    } catch {
      setScanMsg("Scan unavailable — enter details manually.");
    } finally {
      setScanning(false);
    }
  }

  const valid = Number(amount) > 0 && category && date;

  return (
    <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      <button onClick={() => fileRef.current?.click()} className="pawzo-press" style={{ height: receipt ? 120 : 64, borderRadius: 14, border: "1.5px dashed #D9B8EC", background: "var(--p-surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.pink, overflow: "hidden", padding: 0 }}>
        {receipt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receipt} alt="Receipt" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (<><span style={{ fontSize: 18 }}>📎</span><span style={{ fontWeight: 700, fontSize: 13.5 }}>Upload bill / scan receipt</span></>)}
      </button>
      {scanMsg && <p style={{ fontSize: 11.5, color: scanning ? T.gray : T.success, fontWeight: 600, textAlign: "center" }}>{scanning ? <span><span style={{ display: "inline-block", animation: "pawzo-dot 1s infinite" }}>●</span> {scanMsg}</span> : scanMsg}</p>}

      <div>
        <span style={lbl}>Category</span>
        <select style={{ ...inputStyle, fontWeight: 600 }} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><span style={lbl}>Amount</span><input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div style={{ flex: 1 }}><span style={lbl}>Date</span><input style={inputStyle} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div><span style={lbl}>Note (optional)</span><input style={inputStyle} placeholder="e.g. Chicken & rice" value={note} onChange={(e) => setNote(e.target.value)} /></div>

      <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
        <GhostButton full onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton full disabled={!valid} onClick={() => valid && onAdd({ petId, category, amount: Number(amount), date, note: note.trim(), receipt })}>Save</PrimaryButton>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: T.gray, marginBottom: 5 };
