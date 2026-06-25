"use client";

/* PAWZO Food & Feeding — user-defined meals + AI menu suggestions.
   The AI button opens a suggestion sheet (not a chat). It calls the backend,
   which picks region-appropriate meals for the pet, presents 3 options as
   cards the user can accept, tweak, or regenerate. */

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconSpark, IconPlus, inputStyle } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate } from "../../lib/store";
import { mealSuggestApi, type ApiMealSuggestion } from "../../lib/api";

type Draft = { id?: string; name: string; time: string; food: string; kcal: string };
const EMPTY: Draft = { name: "", time: "", food: "", kcal: "" };

export default function FoodPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, update, remove, toggleMealLog } = usePawzo();
  const [form, setForm]               = useState<Draft | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const pet = ready ? selectedPet() : null;
  if (!ready || !authed) return null;
  if (!pet) { router.replace("/pet-profile/new"); return null; }

  const today = todayISO();
  const meals = state.meals.filter((m) => m.petId === pet.id);
  const doneToday = meals.filter((m) => state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today)?.done).length;
  const pct = meals.length ? Math.round((doneToday / meals.length) * 100) : 0;
  const kcalToday = meals.reduce((s, m) => {
    const done = state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today)?.done;
    return s + (done ? m.kcal : 0);
  }, 0);

  const timedMeals = meals.filter((m) => m.time);
  const allSameTime = timedMeals.length >= 2 && timedMeals.every((m) => m.time === timedMeals[0].time);

  const history = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLogs  = state.mealLogs.filter((l) => l.petId === pet.id && l.date === iso);
    const fedLogs  = dayLogs.filter((l) => l.done);
    const fedMeals = fedLogs.map((l) => meals.find((m) => m.id === l.mealId)).filter(Boolean) as typeof meals;
    const total = dayLogs.length > 0 ? dayLogs.length : meals.length;
    const kcal  = fedMeals.reduce((s, m) => s + m.kcal, 0);
    return { iso, count: fedLogs.length, total, kcal, fedMeals };
  });

  function saveMeal() {
    if (!form || !form.name.trim()) return;
    const payload = { petId: pet!.id, name: form.name.trim(), time: form.time.trim(), food: form.food.trim(), kcal: Number(form.kcal) || 0 };
    if (form.id) update("meals", form.id, payload);
    else add("meals", payload);
    setForm(null);
  }

  return (
    <AppFrame>
      <TopBar title="Food" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button className="pawzo-press" style={btn(false)} onClick={() => setForm(EMPTY)}><IconPlus color={T.ink} size={16} /> Add meal</button>
          <button className="pawzo-press" style={btn(true)} onClick={() => setSuggestOpen(true)}><IconSpark color="#fff" size={16} /> AI Suggests</button>
        </div>

        {/* add/edit form */}
        {form && (
          <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 12 }}>{form.id ? "Edit meal" : "New meal"}</p>
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Meal name (e.g. Morning bowl)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input style={inputStyle} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <input style={inputStyle} type="number" placeholder="kcal" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
            </div>
            <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Food (e.g. Chicken & rice · 120g)" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} />
            <div style={{ display: "flex", gap: 10 }}>
              <GhostButton full onClick={() => setForm(null)}>Cancel</GhostButton>
              <PrimaryButton full onClick={saveMeal}>Save</PrimaryButton>
            </div>
          </div>
        )}

        <SectionTitle action={<span style={{ fontSize: 11.5, fontWeight: 700, color: T.grayLight }}>Today</span>}>Today&apos;s menu</SectionTitle>

        {allSameTime && (
          <div className="pawzo-rise" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#92400E", margin: 0 }}>All meals set to {timedMeals[0].time}</p>
              <p style={{ fontSize: 12, color: "#B45309", marginTop: 3, lineHeight: 1.4 }}>
                Feeding all meals at the same time isn&apos;t great for {pet.name}&apos;s digestion. Space them out through the day for better health! 🐾
              </p>
            </div>
          </div>
        )}

        {meals.length === 0 ? (
          <Empty text='No meals yet. Tap "Add meal" or let AI suggest a menu!' />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {meals.map((m) => {
              const done = !!state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today)?.done;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 16, padding: "12px 14px", boxShadow: T.shadowSoft }}>
                  <button onClick={() => toggleMealLog(pet.id, m.id, today)} style={{ width: 26, height: 26, borderRadius: 9, border: `2px solid ${done ? T.success : "#cdbfdd"}`, background: done ? T.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }} aria-label="Mark fed">
                    {done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: done ? T.grayLight : T.ink, textDecoration: done ? "line-through" : "none" }}>{m.name}</span>
                      {m.time && <span style={{ fontSize: 11, color: T.grayLight }}>{m.time}</span>}
                    </div>
                    {m.food && <div style={{ fontSize: 12, color: T.gray, marginTop: 2 }}>{m.food}</div>}
                  </div>
                  {m.kcal > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: T.orange }}>{m.kcal} kcal</span>}
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconAction label="Edit" onClick={() => setForm({ id: m.id, name: m.name, time: m.time, food: m.food, kcal: String(m.kcal) })} />
                    <IconAction label="Delete" danger onClick={() => remove("meals", m.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* completion ring → tap for history */}
        {meals.length > 0 && (
          <>
            <SectionTitle>Food stats</SectionTitle>
            <button onClick={() => setShowHistory((s) => !s)} className="pawzo-press" style={{ width: "100%", border: "none", textAlign: "left", cursor: "pointer", background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, display: "flex", alignItems: "center", gap: 16 }}>
              <Ring pct={pct} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{doneToday}/{meals.length} meals · {kcalToday} kcal</p>
                <p style={{ fontSize: 12, color: T.pink, fontWeight: 700, marginTop: 2 }}>{showHistory ? "Hide history ▲" : "Tap for 7-day history ▼"}</p>
              </div>
            </button>

            {showHistory && (
              <div className="pawzo-rise" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {history.filter((h) => h.count > 0).length === 0 ? (
                  <div style={{ background: "var(--p-surface)", borderRadius: 14, padding: "14px", textAlign: "center", color: T.grayLight, fontSize: 12, boxShadow: T.shadowSoft }}>No meals logged in the past 7 days.</div>
                ) : history.filter((h) => h.count > 0).map((h) => {
                  const origIndex = history.indexOf(h);
                  const label = origIndex === 0 ? "Today" : origIndex === 1 ? "Yesterday" : fmtDate(h.iso);
                  return (
                    <div key={h.iso} style={{ background: "var(--p-surface)", borderRadius: 14, padding: "11px 14px", boxShadow: T.shadowSoft }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{label}</span>
                        <span style={{ fontSize: 12, color: h.count === h.total ? T.success : T.gray, fontWeight: 600 }}>
                          {h.count}/{h.total}{h.kcal > 0 ? ` · ${h.kcal} kcal` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                        {h.fedMeals.map((m) => (
                          <span key={m.id} style={{ fontSize: 11, fontWeight: 700, background: T.primarySoft, color: T.pinkDeep, borderRadius: 8, padding: "3px 8px" }}>
                            🍽️ {m.food || m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Suggestion Sheet */}
      {suggestOpen && (
        <SuggestSheet
          pet={pet}
          onClose={() => setSuggestOpen(false)}
          onAdd={(picked) => {
            picked.forEach((s) => add("meals", { petId: pet.id, name: s.name, time: s.time, food: s.food, kcal: s.kcal }));
            setSuggestOpen(false);
          }}
        />
      )}

      <BottomNav />
    </AppFrame>
  );
}

/* ─── AI Suggestion Sheet ─────────────────────────────────────────────────── */

function SuggestSheet({
  pet,
  onClose,
  onAdd,
}: {
  pet: { id: string; name: string; species: string; region: string };
  onClose: () => void;
  onAdd: (picked: ApiMealSuggestion[]) => void;
}) {
  const [status, setStatus]       = useState<"loading" | "done" | "error">("loading");
  const [suggestions, setSuggestions] = useState<ApiMealSuggestion[]>([]);
  const [selected, setSelected]   = useState<boolean[]>([]);
  const [errorMsg, setErrorMsg]   = useState("");
  const fetchCount = useRef(0);

  function getRegion() {
    if (pet.region) return pet.region;
    try { return localStorage.getItem("pawzo:lastRegion") ?? ""; } catch { return ""; }
  }

  async function fetchSuggestions() {
    setStatus("loading");
    setErrorMsg("");
    const id = ++fetchCount.current;
    try {
      const res = await mealSuggestApi.suggest(pet.id, getRegion());
      if (id !== fetchCount.current) return; // stale
      setSuggestions(res.suggestions);
      setSelected(res.suggestions.map(() => true));
      setStatus("done");
    } catch (e: unknown) {
      if (id !== fetchCount.current) return;
      setErrorMsg(e instanceof Error ? e.message : "Failed to get suggestions");
      setStatus("error");
    }
  }

  useEffect(() => { fetchSuggestions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickedCount = selected.filter(Boolean).length;
  const region = getRegion();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.54)" }} />

      <div style={{ position: "relative", background: "var(--p-bg)", borderRadius: "24px 24px 0 0", maxHeight: "88vh", overflowY: "auto", padding: "4px 20px 36px" }}>
        {/* handle */}
        <div style={{ width: 40, height: 4, background: "var(--p-border)", borderRadius: 2, margin: "10px auto 18px" }} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.ink, margin: 0 }}>
              AI Menu for {pet.name} 🍽️
            </h2>
            {region && (
              <p style={{ fontSize: 12, color: T.grayLight, margin: "3px 0 0", fontWeight: 600 }}>
                Based on: {region} · {pet.species}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: "var(--p-surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gray, fontSize: 15, fontWeight: 800 }}>✕</button>
        </div>

        {/* loading */}
        {status === "loading" && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤔</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.gray }}>Thinking up the perfect menu…</p>
            <p style={{ fontSize: 12, color: T.grayLight, marginTop: 4 }}>Picking ingredients from {region || "your region"}</p>
          </div>
        )}

        {/* error */}
        {status === "error" && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>😕</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.danger }}>{errorMsg}</p>
            <button onClick={fetchSuggestions} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, border: "none", background: T.pink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Try again</button>
          </div>
        )}

        {/* suggestions */}
        {status === "done" && (
          <>
            <p style={{ fontSize: 12.5, color: T.gray, margin: "8px 0 14px", lineHeight: 1.5 }}>
              Here are 3 meal ideas tailored for {pet.name}. Tap a card to select or deselect it, then add the ones you like.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {suggestions.map((s, i) => {
                const on = selected[i];
                return (
                  <button
                    key={i}
                    onClick={() => setSelected((prev) => prev.map((v, j) => j === i ? !v : v))}
                    className="pawzo-press"
                    style={{
                      width: "100%", textAlign: "left", cursor: "pointer",
                      background: on ? T.primarySoft : "var(--p-surface)",
                      border: `2px solid ${on ? T.pink : "var(--p-border)"}`,
                      borderRadius: 18, padding: "14px 16px",
                      boxShadow: on ? `0 0 0 0px ${T.pink}` : T.shadowSoft,
                      transition: "all 180ms",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {/* checkbox */}
                      <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? T.pink : "#cdbfdd"}`, background: on ? T.pink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: on ? T.pinkDeep : T.ink, flex: 1 }}>{s.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.orange, background: "#FFF7ED", borderRadius: 8, padding: "2px 8px", flexShrink: 0 }}>{s.kcal} kcal</span>
                    </div>

                    <p style={{ fontSize: 13, color: T.gray, margin: "0 0 6px 32px", lineHeight: 1.4 }}>🍖 {s.food}</p>

                    {s.time && (
                      <p style={{ fontSize: 11.5, color: T.grayLight, margin: "0 0 6px 32px" }}>⏰ {s.time}</p>
                    )}

                    <p style={{ fontSize: 11.5, color: on ? T.pinkDeep : T.grayLight, margin: "0 0 0 32px", fontStyle: "italic", lineHeight: 1.4 }}>
                      {s.reason}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* actions */}
            <button
              onClick={fetchSuggestions}
              className="pawzo-press"
              style={{ width: "100%", padding: "12px 0", borderRadius: 14, border: `1.5px solid var(--p-border)`, background: "transparent", fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: T.gray, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              🔄 Try different options
            </button>

            <button
              onClick={() => onAdd(suggestions.filter((_, i) => selected[i]))}
              disabled={pickedCount === 0}
              className="pawzo-press"
              style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: pickedCount > 0 ? T.pink : T.grayLight, fontWeight: 800, fontSize: 15, cursor: pickedCount > 0 ? "pointer" : "not-allowed", color: "#fff" }}
            >
              Add {pickedCount === 0 ? "meals" : pickedCount === 1 ? "1 meal" : `${pickedCount} meals`} to schedule ✨
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Shared primitives ───────────────────────────────────────────────────── */

function Empty({ text }: { text: string }) {
  return <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 20, textAlign: "center", color: T.grayLight, fontSize: 13, boxShadow: T.shadowSoft }}>{text}</div>;
}
function IconAction({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} className="pawzo-press" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: danger ? T.dangerBg : "var(--p-surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {danger ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      )}
    </button>
  );
}
function btn(primary: boolean): React.CSSProperties {
  return { flex: 1, height: 44, borderRadius: 14, border: primary ? "none" : "1.5px solid var(--p-border)", background: primary ? T.pink : "var(--p-surface)", color: primary ? "#fff" : T.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
}
function Ring({ pct }: { pct: number }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0 }}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--p-surface-2)" strokeWidth="9" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--p-primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} transform="rotate(-90 38 38)" style={{ transition: "stroke-dashoffset 600ms" }} />
      <text x="38" y="43" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--p-ink)">{pct}%</text>
    </svg>
  );
}
