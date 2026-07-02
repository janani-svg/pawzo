"use client";

/* PAWZO Environment — habitat & maintenance tasks per pet, species-aware.
   Each task stores a frequency + last-completed date; the next-due date and
   status badge are derived automatically. "Mark complete" stamps today and
   recalculates the next due date — no manual date entry after setup. Tasks
   feed the shared notification system (see deriveAlerts in lib/store). */

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle } from "../../components/pawzo-ui";
import {
  usePawzo, useRequireAuth, todayISO, fmtDate, daysUntil,
  computeNextDue, envTaskStatus, freqLabel, ENV_TASK_TEMPLATES,
  type EnvTask, type EnvStatus,
} from "../../lib/store";
import { speciesEmoji } from "../../dashboard/page";

type FreqKind = "Daily" | "Weekly" | "Every X Days" | "Monthly" | "Custom";
type Draft = { id?: string; name: string; kind: FreqKind; everyX: string; customN: string; customUnit: "Days" | "Weeks" | "Months"; lastCompleted: string };

const STATUS_META: Record<EnvStatus, { label: string; color: string; bg: string }> = {
  completed: { label: "Completed", color: "#166534", bg: "#ECFDF5" },
  upcoming:  { label: "Upcoming",  color: "#1E40AF", bg: "#EFF6FF" },
  due:       { label: "Due Soon",  color: "#92400E", bg: "#FEF3C7" },
  overdue:   { label: "Overdue",   color: "#D4183D", bg: "#FEF2F2" },
};
const STATUS_ORDER: Record<EnvStatus, number> = { overdue: 0, due: 1, upcoming: 2, completed: 3 };

function EnvConfetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#F5A0C0", "#F9D040", "#A0D8F0", "#C0E8A0", "#E8A0F5", "#F5C060", "#80D8C0"];
    type P = { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; rotV: number };
    const pieces: P[] = [];
    let frame = 0, raf: number;
    function spawn() {
      pieces.push({ x: Math.random() * canvas!.width, y: -8, vx: (Math.random() - 0.5) * 2.5, vy: 1.5 + Math.random() * 2.5, size: 3 + Math.random() * 5, color: COLORS[Math.floor(Math.random() * COLORS.length)], rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.14 });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const rate = frame < 80 ? 2 : frame < 150 ? 3 : 6;
      if (frame < 220 && frame % rate === 0) spawn();
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]; p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.035;
        if (p.y > canvas!.height + 10) { pieces.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = 0.9; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
        ctx.restore();
      }
      frame++; raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 499 }} />;
}

function relDay(iso: string): string {
  if (!iso) return "Never";
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${Math.abs(d)} days ago`;
  return `in ${d} days`;
}

function intervalFromDraft(f: Draft): number {
  if (f.kind === "Daily") return 1;
  if (f.kind === "Weekly") return 7;
  if (f.kind === "Monthly") return 30;
  if (f.kind === "Every X Days") return Math.max(1, parseInt(f.everyX, 10) || 1);
  const n = Math.max(1, parseInt(f.customN, 10) || 1);
  return n * (f.customUnit === "Weeks" ? 7 : f.customUnit === "Months" ? 30 : 1);
}

function draftFromTask(t: EnvTask): Draft {
  const d = t.intervalDays;
  const kind: FreqKind = d === 1 ? "Daily" : d === 7 ? "Weekly" : d === 30 ? "Monthly" : "Every X Days";
  return { id: t.id, name: t.name, kind, everyX: kind === "Every X Days" ? String(d) : "3", customN: "1", customUnit: "Days", lastCompleted: t.lastCompleted };
}

export default function EnvironmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, selectPet, add, update, remove } = usePawzo();

  useEffect(() => {
    const petId = searchParams.get("petId");
    if (petId && ready) selectPet(petId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const [form, setForm] = useState<Draft | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const undoRef = useRef<Record<string, { lastCompleted: string; nextDue: string }>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const snapPositions = useRef<Record<string, number>>({});

  const pet = ready ? selectedPet() : null;

  const tasks = (pet
    ? state.environment
        .filter((t) => t.petId === pet.id)
        .sort((a, b) => {
          const sa = STATUS_ORDER[envTaskStatus(a)], sb = STATUS_ORDER[envTaskStatus(b)];
          return sa !== sb ? sa - sb : (a.nextDue || "").localeCompare(b.nextDue || "");
        })
    : []);

  // FLIP: after tasks re-sort, animate each card from its old position to its new one
  // Must be declared before any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!Object.keys(snapPositions.current).length) return;
    for (const [id, el] of Object.entries(itemRefs.current)) {
      if (!el || snapPositions.current[id] === undefined) continue;
      const delta = snapPositions.current[id] - el.getBoundingClientRect().top;
      if (delta === 0) continue;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // force reflow
      el.style.transition = "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "translateY(0)";
    }
    snapPositions.current = {};
  }, [tasks]);

  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const counts = tasks.reduce(
    (acc, t) => { acc[envTaskStatus(t)]++; return acc; },
    { completed: 0, upcoming: 0, due: 0, overdue: 0 } as Record<EnvStatus, number>,
  );

  const existing = new Set(tasks.map((t) => t.name.toLowerCase()));
  const suggestions = (ENV_TASK_TEMPLATES[pet.species] ?? ENV_TASK_TEMPLATES.Other)
    .filter((s) => !existing.has(s.name.toLowerCase()));

  function openNew() {
    setForm({ name: "", kind: "Weekly", everyX: "3", customN: "1", customUnit: "Days", lastCompleted: "" });
  }

  function saveTask() {
    if (!form || !form.name.trim()) return;
    const intervalDays = intervalFromDraft(form);
    const last = form.lastCompleted; // may be "" — task never completed yet
    const payload = {
      petId: pet!.id,
      name: form.name.trim(),
      frequency: freqLabel(intervalDays),
      intervalDays,
      lastCompleted: last,
      nextDue: computeNextDue(last, intervalDays),
    };
    if (form.id) update("environment", form.id, payload);
    else add("environment", payload);
    setForm(null);
  }

  function markComplete(t: EnvTask) {
    const today = todayISO();
    undoRef.current[t.id] = { lastCompleted: t.lastCompleted, nextDue: t.nextDue };
    setCompleting(t.id);
    setTimeout(() => {
      // snapshot current positions for FLIP before re-sort
      for (const [id, el] of Object.entries(itemRefs.current)) {
        if (el) snapPositions.current[id] = el.getBoundingClientRect().top;
      }
      update("environment", t.id, { lastCompleted: today, nextDue: computeNextDue(today, t.intervalDays) });
      setCompleting(null);
      setConfetti(true);
      setToast(t.name);
      setTimeout(() => setConfetti(false), 3000);
      setTimeout(() => setToast(null), 3200);
    }, 700);
  }

  function undoComplete(t: EnvTask) {
    const prev = undoRef.current[t.id];
    delete undoRef.current[t.id];
    // Restore the pre-completion dates if we have them, else reset to "not yet done".
    if (prev) update("environment", t.id, { lastCompleted: prev.lastCompleted, nextDue: prev.nextDue });
    else update("environment", t.id, { lastCompleted: "", nextDue: computeNextDue("", t.intervalDays) });
  }

  function addSuggested(s: { name: string; intervalDays: number }) {
    add("environment", {
      petId: pet!.id, name: s.name, frequency: freqLabel(s.intervalDays),
      intervalDays: s.intervalDays, lastCompleted: "", nextDue: computeNextDue("", s.intervalDays),
    });
  }

  return (
    <AppFrame>
      <EnvConfetti active={confetti} />

      {toast && (
        <div className="pawzo-rise" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, background: "linear-gradient(135deg,#10B981,#34D399)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#064E3B", letterSpacing: 0.9, margin: "0 0 2px" }}>TASK DONE!</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>{toast} — great job! 🐾</p>
          </div>
        </div>
      )}

      <TopBar title="Environment" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        {/* subtitle + species pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 2px 12px" }}>
          <p style={{ fontSize: 12.5, color: T.grayLight, margin: 0, fontWeight: 600 }}>Habitat &amp; Maintenance</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#0F766E", background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 14 }}>{speciesEmoji(pet.species)}</span>{pet.species}
          </span>
        </div>

        {/* status stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {([
            { k: "due" as const,      v: counts.due,      label: "Due soon", num: "#92400E", lbl: "#B45309", bg: "#FEF3C7" },
            { k: "overdue" as const,  v: counts.overdue,  label: "Overdue",  num: "#D4183D", lbl: "#B91C1C", bg: "#FEF2F2" },
            { k: "completed" as const, v: counts.completed, label: "Done",     num: "#10B981", lbl: "#166534", bg: "#ECFDF5" },
          ]).map((s) => (
            <div key={s.k} style={{ flex: 1, background: s.bg, borderRadius: 14, padding: "11px 6px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.num, lineHeight: 1, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: s.lbl, textTransform: "uppercase", letterSpacing: "0.4px", margin: "4px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {!form && (
          <button onClick={openNew} className="pawzo-press" style={{ width: "100%", padding: "12px 0", borderRadius: 13, border: "1.5px dashed #5EEAD4", background: "#F0FDFA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#0F766E", fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>
            <IconPlus color="#0F766E" size={16} /> Add task
          </button>
        )}

        {/* add / edit form */}
        {form && (
          <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 12 }}>{form.id ? "Edit task" : "New task"}</p>
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Task name (e.g. Tank Cleaning)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.gray, marginBottom: 6 }}>Frequency</span>
            <select style={{ ...inputStyle, fontWeight: 600, marginBottom: 10 }} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as FreqKind })}>
              {(["Daily", "Weekly", "Every X Days", "Monthly", "Custom"] as FreqKind[]).map((k) => <option key={k}>{k}</option>)}
            </select>

            {form.kind === "Every X Days" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: T.gray }}>Every</span>
                <input style={{ ...inputStyle, width: 80 }} type="number" min="1" value={form.everyX} onChange={(e) => setForm({ ...form, everyX: e.target.value })} />
                <span style={{ fontSize: 13, color: T.gray }}>days</span>
              </div>
            )}
            {form.kind === "Custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: T.gray }}>Every</span>
                <input style={{ ...inputStyle, width: 80 }} type="number" min="1" value={form.customN} onChange={(e) => setForm({ ...form, customN: e.target.value })} />
                <select style={{ ...inputStyle, flex: 1, fontWeight: 600 }} value={form.customUnit} onChange={(e) => setForm({ ...form, customUnit: e.target.value as Draft["customUnit"] })}>
                  <option>Days</option><option>Weeks</option><option>Months</option>
                </select>
              </div>
            )}

            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.gray, marginBottom: 6 }}>Last completed</span>
            <input style={{ ...inputStyle, marginBottom: 12 }} type="date" max={todayISO()} value={form.lastCompleted} onChange={(e) => setForm({ ...form, lastCompleted: e.target.value })} />

            <div style={{ background: "#F0FDFA", border: "1.5px solid #CCFBF1", borderRadius: 12, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "#0F766E" }}>Next due (auto)</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0F766E" }}>{fmtDate(computeNextDue(form.lastCompleted || todayISO(), intervalFromDraft(form)))}</span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <GhostButton full onClick={() => setForm(null)}>Cancel</GhostButton>
              <PrimaryButton full onClick={saveTask}>Save</PrimaryButton>
            </div>
          </div>
        )}

        {/* suggested quick-add */}
        {suggestions.length > 0 && (
          <>
            <SectionTitle action={<span style={{ fontSize: 11.5, fontWeight: 700, color: T.grayLight }}>For {pet.species.toLowerCase()}</span>}>Suggested tasks</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {suggestions.map((s) => (
                <button key={s.name} onClick={() => addSuggested(s)} className="pawzo-press" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--p-surface)", border: "1.5px solid #99F6E4", borderRadius: 20, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "#0F766E", cursor: "pointer" }}>
                  <IconPlus color="#0F766E" size={13} /> {s.name} · {freqLabel(s.intervalDays)}
                </button>
              ))}
            </div>
          </>
        )}

        <SectionTitle action={tasks.length > 0 ? <span style={{ fontSize: 11.5, fontWeight: 700, color: T.grayLight }}>{tasks.length} task{tasks.length > 1 ? "s" : ""}</span> : undefined}>Tasks</SectionTitle>

        {tasks.length === 0 ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 22, textAlign: "center", boxShadow: T.shadowSoft }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🏡</div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, margin: "0 0 5px" }}>No habitat tasks yet</p>
            <p style={{ fontSize: 12, color: T.grayLight, lineHeight: 1.5, margin: 0 }}>Add a task or pick a suggestion to keep {pet.name}&apos;s space clean &amp; healthy.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((t) => {
              const st = envTaskStatus(t);
              const meta = STATUS_META[st];
              return (
                <div key={t.id} ref={(el) => { itemRefs.current[t.id] = el; }} style={{ background: "var(--p-surface)", borderRadius: 16, padding: "13px 14px", boxShadow: T.shadowSoft }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>{t.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{meta.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginBottom: 11 }}>
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: T.grayLight, textTransform: "uppercase", letterSpacing: "0.4px", margin: 0 }}>Last done</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.gray, margin: "1px 0 0" }}>{relDay(t.lastCompleted)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: T.grayLight, textTransform: "uppercase", letterSpacing: "0.4px", margin: 0 }}>Next due</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: meta.color, margin: "1px 0 0" }}>{relDay(t.nextDue)}</p>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: T.grayLight, textTransform: "uppercase", letterSpacing: "0.4px", margin: 0 }}>Every</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.gray, margin: "1px 0 0" }}>{t.frequency}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {st === "completed" ? (
                      <button onClick={() => undoComplete(t)} className="pawzo-press" title="Tap to undo" style={{ flex: 1, height: 36, borderRadius: 11, border: "none", background: "#10B981", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        Completed · tap to undo
                      </button>
                    ) : (
                      <button
                        onClick={() => completing !== t.id && markComplete(t)}
                        className="pawzo-press"
                        style={{
                          flex: 1, height: 36, borderRadius: 11, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          transition: "background 0.25s, border-color 0.25s, color 0.25s",
                          border: completing === t.id ? "none" : "1.5px solid #99F6E4",
                          background: completing === t.id ? "#10B981" : "var(--p-surface-2)",
                          color: completing === t.id ? "#fff" : "#0F766E",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={completing === t.id ? "#fff" : "#0F766E"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {completing === t.id
                            ? <path d="M20 6 9 17l-5-5" />
                            : <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5 11 15l4.5-5" /></>}
                        </svg>
                        {completing === t.id ? "Completed!" : "Mark complete"}
                      </button>
                    )}
                    <button onClick={() => setForm(draftFromTask(t))} className="pawzo-press" aria-label="Edit task" style={{ width: 42, height: 36, borderRadius: 11, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gray} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) remove("environment", t.id); }} className="pawzo-press" aria-label="Delete task" style={{ width: 42, height: 36, borderRadius: 11, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ fontSize: 11, color: T.grayLight, textAlign: "center", margin: "16px 8px 0", lineHeight: 1.5 }}>
          Marking a task complete stamps today and recalculates the next due date automatically. Reminders appear in your Alerts tab.
        </p>
      </div>

      <BottomNav />
    </AppFrame>
  );
}
