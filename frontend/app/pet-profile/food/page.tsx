"use client";

/* PAWZO Food & Feeding — user-defined meals, ingredient AI eval,
   and AI nutrition plan with household-measure recipes. */

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AppFrame, BottomNav, TopBar, SectionTitle, PrimaryButton, GhostButton, T, IconPlus, inputStyle, AiDisclaimer } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fmtDate } from "../../lib/store";
import { foodEvalApi, mealSuggestApi, type ApiFoodEval, type ApiMealSuggestion } from "../../lib/api";

type Draft = { id?: string; name: string; time: string; food: string; kcal: string; ingredients: string };
const EMPTY: Draft = { name: "", time: "", food: "", kcal: "", ingredients: "" };

export default function FoodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authed } = useRequireAuth();
  const { state, selectedPet, add, update, remove, toggleMealLog, selectPet } = usePawzo();

  useEffect(() => {
    const petId = searchParams.get("petId");
    if (petId && ready) selectPet(petId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const [form, setForm]               = useState<Draft | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // AI food evaluation
  const [foodEval, setFoodEval]       = useState<ApiFoodEval | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // AI meal suggestions
  const [mealSuggestions, setMealSuggestions]   = useState<ApiMealSuggestion[] | null>(null);
  const [suggestLoading, setSuggestLoading]     = useState(false);

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

  const timedMeals  = meals.filter((m) => m.time);
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
    setFoodEval(null);
  }

  async function aiEvaluate() {
    if (!form) return;
    const foodStr = [form.name.trim(), form.food.trim()].filter(Boolean).join(" - ");
    setEvalLoading(true);
    try {
      const res = await foodEvalApi.evaluate(pet!.id, foodStr, form.ingredients.trim());
      setFoodEval(res);
    } catch {
      // silent fail
    } finally {
      setEvalLoading(false);
    }
  }

  async function fetchMealSuggestions() {
    setSuggestLoading(true);
    try {
      const res = await mealSuggestApi.suggest(pet!.id, pet!.region || "");
      setMealSuggestions(res.suggestions);
    } catch {
      // silent fail
    } finally {
      setSuggestLoading(false);
    }
  }

  function addSuggestionToPlanner(s: ApiMealSuggestion) {
    add("meals", { petId: pet!.id, name: s.name, time: s.time, food: s.food, kcal: s.kcal });
  }

  return (
    <AppFrame>
      <TopBar title="Food" back="/pet-profile" />

      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button className="pawzo-press" style={btn(false)} onClick={() => { setForm(EMPTY); setFoodEval(null); }}><IconPlus color={T.ink} size={16} /> Add meal</button>
        </div>

        {/* Add / edit form */}
        {form && (
          <div className="pawzo-rise" style={{ background: "var(--p-surface)", borderRadius: 18, padding: 16, boxShadow: T.shadowSoft, marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 12 }}>{form.id ? "Edit meal" : "New meal"}</p>
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Meal name (e.g. Morning bowl)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input style={inputStyle} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <input style={inputStyle} type="number" placeholder="kcal" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
            </div>
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Food (e.g. Chicken & rice · 120g)" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} />
            <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Ingredients (optional — AI will evaluate these)" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <GhostButton full onClick={() => { setForm(null); setFoodEval(null); }}>Cancel</GhostButton>
              <button onClick={aiEvaluate} disabled={evalLoading} className="pawzo-press" style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid #99F6E4", background: "#F0FDFA", color: "#0F766E", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {evalLoading ? "Evaluating…" : "🤖 Evaluate"}
              </button>
              <PrimaryButton full onClick={saveMeal}>Save</PrimaryButton>
            </div>
          </div>
        )}

        {/* AI food eval result */}
        {foodEval && form && (
          <div className="pawzo-rise" style={{ marginTop: -6, marginBottom: 14 }}>
            {foodEval.suitable ? (
              <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 16, padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 6 }}>✅ Suitable for {pet.name}!</p>
                <p style={{ fontSize: 12.5, color: "#15803D", lineHeight: 1.5, marginBottom: foodEval.serving ? 8 : 0 }}>{foodEval.reason}</p>
                {foodEval.serving && (
                  <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 10, padding: "8px 12px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 3 }}>Suggested serving:</p>
                    <p style={{ fontSize: 12.5, color: "#14532D" }}>{foodEval.serving}</p>
                  </div>
                )}
                <AiDisclaimer />
              </div>
            ) : (
              <div style={{ background: "#FFF1F2", border: "1.5px solid #FECACA", borderRadius: 16, padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#991B1B", marginBottom: 6 }}>⚠️ Not suitable for {pet.name}</p>
                <p style={{ fontSize: 12.5, color: "#B91C1C", lineHeight: 1.5, marginBottom: foodEval.alternative ? 8 : 0 }}>{foodEval.reason}</p>
                {foodEval.alternative && (
                  <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 10, padding: "8px 12px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 3 }}>Try instead:</p>
                    <p style={{ fontSize: 12.5, color: "#7F1D1D" }}>{foodEval.alternative}</p>
                  </div>
                )}
                <AiDisclaimer />
              </div>
            )}
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
          <Empty text='No meals yet. Tap "Add meal" to log your first meal.' />
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
                    <IconAction label="Edit" onClick={() => { setForm({ id: m.id, name: m.name, time: m.time, food: m.food, kcal: String(m.kcal), ingredients: "" }); setFoodEval(null); }} />
                    <IconAction label="Delete" danger onClick={() => remove("meals", m.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Food stats */}
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

        {/* AI Meal Suggestions */}
        <SectionTitle>AI Meal Suggestions</SectionTitle>

        {!mealSuggestions && !suggestLoading && (
          <button onClick={fetchMealSuggestions} className="pawzo-press" style={{ width: "100%", background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0F766E" }}>Get meal suggestions for {pet.name}</p>
              <p style={{ fontSize: 11.5, color: "#134E4A" }}>Region-based meal names, times & portions for {pet.species.toLowerCase()}s</p>
            </div>
          </button>
        )}

        {suggestLoading && (
          <div style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 18, padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#0F766E" }}>Generating meal suggestions for {pet.name}…</p>
          </div>
        )}

        {mealSuggestions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mealSuggestions.map((s, i) => {
              const cardBgs     = ["#FEFCE8", "#F0FDF4", "var(--p-surface)"];
              const cardBorders = ["#FDE68A", "#BBF7D0", "var(--p-border)"];
              return (
                <div key={i} style={{ background: cardBgs[i] ?? "var(--p-surface)", border: `1.5px solid ${cardBorders[i] ?? "var(--p-border)"}`, borderRadius: 16, padding: 14 }}>
                  {/* Meal name + time pill */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>{s.name}</p>
                    {s.time && (
                      <span style={{ fontSize: 12, fontWeight: 700, background: T.primarySoft, color: T.pinkDeep, border: `1px solid #FBD0E4`, borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>
                        🕐 {s.time}
                      </span>
                    )}
                  </div>
                  {/* Food description */}
                  <p style={{ fontSize: 12.5, color: T.gray, lineHeight: 1.5, margin: "0 0 4px" }}>{s.food}</p>
                  {/* kcal */}
                  {s.kcal > 0 && (
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: T.orange, margin: "0 0 4px" }}>{s.kcal} kcal</p>
                  )}
                  {/* Reason */}
                  <p style={{ fontSize: 11.5, color: T.grayLight, fontStyle: "italic", margin: "0 0 10px" }}>{s.reason}</p>
                  <button onClick={() => addSuggestionToPlanner(s)} className="pawzo-press" style={{ fontSize: 12, fontWeight: 700, color: T.pinkDeep, background: T.primarySoft, border: `1px solid #FBD0E4`, borderRadius: 10, padding: "6px 14px", cursor: "pointer" }}>
                    + Add to schedule
                  </button>
                </div>
              );
            })}
            <button onClick={fetchMealSuggestions} className="pawzo-press" style={{ width: "100%", padding: "11px 0", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: T.gray }}>
              🔄 Regenerate
            </button>
            <AiDisclaimer />
          </div>
        )}

      </div>

      <BottomNav />
    </AppFrame>
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
