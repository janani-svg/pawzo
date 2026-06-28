"use client";

/* PAWZO Onboarding — questionnaire → notifications → app tour.
   "Other" pet type opens a searchable autocomplete (predicts as you type,
   accepts a custom entry). Region is saved for food/recipe/AI personalisation
   only. First-time owners continue to Add Pet (which returns to Dashboard). */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawzoLogo, PrimaryButton, GhostButton, T } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth } from "../lib/store";

const PET_TYPES: { value: string; label: string }[] = [
  { value: "Dog",        label: "🐶 Dog" },
  { value: "Cat",        label: "🐱 Cat" },
  { value: "Bird",       label: "🦜 Bird" },
  { value: "Rabbit",     label: "🐰 Rabbit" },
  { value: "Guinea pig", label: "🐹 Guinea pig" },
  { value: "Hamster",    label: "🐹 Hamster" },
  { value: "Fish",       label: "🐠 Fish" },
  { value: "Reptile",    label: "🦎 Reptile" },
  { value: "Other",      label: "🐾 Other" },
];
const ANIMAL_SUGGESTIONS = ["Turtle", "Tortoise", "Hedgehog", "Ferret", "Chinchilla", "Gecko", "Iguana", "Snake", "Parrot", "Cockatiel", "Budgie", "Canary", "Goldfish", "Betta fish", "Pony", "Goat", "Pig", "Duck", "Chicken", "Frog", "Axolotl", "Tarantula", "Mouse", "Rat", "Gerbil"];
const EXPERIENCE = [
  { k: "first_time", label: "🌱 First-time pet parent" },
  { k: "beginner",   label: "🐣 Beginner" },
  { k: "intermediate", label: "🐕 Intermediate" },
  { k: "experienced",  label: "🏆 Experienced pet owner" },
];
const REGIONS = ["North America", "South America", "Europe", "Africa", "Middle East", "South Asia", "East Asia", "Southeast Asia", "Oceania"];
const TOUR = [
  { emoji: "🏠", title: "Your cozy dashboard", body: "All your pets and today's plan in one happy view." },
  { emoji: "🩺", title: "Track every detail", body: "Health, feeding, growth and expenses — gently organised." },
  { emoji: "✨", title: "Meet your AI helper", body: "Ask anything about care and get warm, smart answers." },
];

export default function Onboarding() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [step, setStep] = useState(0);
  const [owner, setOwner] = useState<boolean | null>(null);
  const [petType, setPetType] = useState("Dog");
  const [otherType, setOtherType] = useState("");
  const [exp, setExp] = useState("");
  const [region, setRegion] = useState("North America");
  const [tour, setTour] = useState(0);

  if (!ready) return null;

  const totalDots = 6;
  const next = () => setStep((s) => s + 1);

  function finish() {
    try { localStorage.setItem("pawzo:lastRegion", region); } catch {}
    try { localStorage.setItem("pawzo:onboarded", "1"); } catch {}
    const finalType = petType === "Other" ? (otherType.trim() || "Other") : petType;
    try { localStorage.setItem("pawzo:lastPetType", finalType); } catch {}
    router.push(owner === false ? "/dashboard" : "/pet-profile/new");
  }

  const canContinue =
    (step === 0 && owner !== null) ||
    (step === 1 && (petType !== "Other" || otherType.trim().length > 0)) ||
    (step === 2 && !!exp) ||
    step === 3;

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: T.maxW, minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><PawzoLogo size={22} /></div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 26 }}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <div key={i} style={{ height: 6, flex: 1, maxWidth: 44, borderRadius: 3, background: i <= step ? T.pink : "var(--p-border)", transition: "background 300ms" }} />
          ))}
        </div>

        <div key={step} className="pawzo-rise" style={{ flex: 1 }}>
          {step === 0 && (
            <Q title="🐾 Are you a pet owner?" sub="This helps us tailor your first steps.">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Choice selected={owner === true}  onClick={() => setOwner(true)}  label="🐶 Yes, I have a pet!" />
                <Choice selected={owner === false} onClick={() => setOwner(false)} label="🌟 Not yet, but planning to" />
              </div>
            </Q>
          )}

          {step === 1 && (
            <Q title={owner === false ? "🐾 What pet do you plan to have?" : "🐾 What type of pet do you have?"} sub="You can always add more later.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PET_TYPES.map((p) => (
                  <Choice key={p.value} selected={petType === p.value} onClick={() => setPetType(p.value)} label={p.label} compact />
                ))}
              </div>
              {petType === "Other" && (
                <div className="pawzo-rise" style={{ marginTop: 14 }}>
                  <Autocomplete value={otherType} onChange={setOtherType} options={ANIMAL_SUGGESTIONS} placeholder="Type your pet (e.g. Hedgehog)" />
                </div>
              )}
            </Q>
          )}

          {step === 2 && (
            <Q title="🏅 How experienced are you with pet care?" sub="We'll match tips to your level.">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {EXPERIENCE.map((e) => (
                  <Choice key={e.k} selected={exp === e.k} onClick={() => setExp(e.k)} label={e.label} />
                ))}
              </div>
            </Q>
          )}

          {step === 3 && (
            <Q title="🌍 Which region do you belong to?" sub="Used only to personalise food plans, recipes & AI menus — never for finding vets.">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "var(--p-surface-2)", border: "1px solid var(--p-border)", borderRadius: 14, padding: "10px 14px", fontSize: 12, color: T.gray }}>
                  We suggest ingredients & recipes commonly available where you live.
                </div>
                <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: "100%", height: 50, borderRadius: 14, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", padding: "0 14px", fontSize: 15, color: T.ink, fontWeight: 600 }}>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </Q>
          )}

          {step === 4 && (
            <Q title="🔔 Stay in the loop?" sub="We'll only ping you for the things that matter.">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "🍽️ Feeding & medication reminders",
                  "🏥 Vet appointment alerts",
                  "💛 Health check-in nudges",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--p-surface)", borderRadius: 14, padding: "12px 14px", boxShadow: T.shadowSoft }}>
                    <span style={{ color: T.success, fontWeight: 800 }}>✓</span>
                    <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{t}</span>
                  </div>
                ))}
              </div>
            </Q>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 20 }}>
              <div key={tour} className="pawzo-rise pawzo-bob" style={{ fontSize: 84, marginBottom: 20 }}>{TOUR[tour].emoji}</div>
              <h2 style={{ fontSize: 23, fontWeight: 800, color: T.ink, margin: "0 0 10px" }}>{TOUR[tour].title}</h2>
              <p style={{ fontSize: 15, color: T.gray, lineHeight: 1.5, maxWidth: 300 }}>{TOUR[tour].body}</p>
              <div style={{ display: "flex", gap: 7, marginTop: 22 }}>
                {TOUR.map((_, i) => <div key={i} style={{ width: i === tour ? 22 : 8, height: 8, borderRadius: 4, background: i === tour ? T.pink : "var(--p-border)", transition: "all 250ms" }} />)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {step <= 3 && <PrimaryButton full onClick={next} disabled={!canContinue}>Continue</PrimaryButton>}
          {step === 4 && (<><PrimaryButton full onClick={() => { setSettings({ push: true }); next(); }}>Enable notifications</PrimaryButton><GhostButton full onClick={() => { setSettings({ push: false }); next(); }}>Maybe later</GhostButton></>)}
          {step === 5 && (
            <>
              {tour < TOUR.length - 1
                ? <PrimaryButton full onClick={() => setTour((t) => t + 1)}>Next</PrimaryButton>
                : <PrimaryButton full onClick={finish}>Start using Pawzo</PrimaryButton>}
              <button onClick={finish} style={{ background: "none", border: "none", color: T.gray, fontSize: 13.5, fontWeight: 700, cursor: "pointer", padding: 8 }}>Skip tour</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Q({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.ink, margin: "0 0 6px", lineHeight: 1.25 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13.5, color: T.gray, margin: "0 0 22px", lineHeight: 1.45 }}>{sub}</p>}
      {children}
    </div>
  );
}

function Choice({ selected, onClick, label, compact }: { selected: boolean; onClick: () => void; label: string; compact?: boolean }) {
  return (
    <button onClick={onClick} className="pawzo-press" style={{ display: "flex", alignItems: "center", width: "100%", padding: compact ? "13px 14px" : "16px", borderRadius: 16, cursor: "pointer", background: selected ? T.primarySoft : "var(--p-surface)", border: `2px solid ${selected ? T.pink : "transparent"}`, boxShadow: selected ? "0 4px 14px rgba(236,72,153,0.16)" : T.shadowSoft }}>
      <span style={{ fontSize: compact ? 14 : 15, fontWeight: 700, color: selected ? T.pinkDeep : T.ink }}>{label}</span>
    </button>
  );
}

/* searchable autocomplete with prediction + custom entry */
export function Autocomplete({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = q ? options.filter((o) => o.toLowerCase().includes(q)).slice(0, 5) : options.slice(0, 5);
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ width: "100%", height: 48, padding: "0 14px", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 15, color: T.ink, outline: "none" }}
      />
      {open && matches.length > 0 && (
        <div style={{ position: "absolute", top: 54, left: 0, right: 0, background: "var(--p-surface)", borderRadius: 14, boxShadow: T.shadow, border: "1px solid var(--p-border)", overflow: "hidden", zIndex: 20 }}>
          {matches.map((m) => (
            <button key={m} onMouseDown={() => { onChange(m); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", borderBottom: "1px solid var(--p-border)", fontSize: 14, color: T.ink, cursor: "pointer" }}>
              {m}
            </button>
          ))}
        </div>
      )}
      {q && !options.some((o) => o.toLowerCase() === q) && (
        <p style={{ fontSize: 11.5, color: T.grayLight, marginTop: 6 }}>Press continue to use “{value.trim()}”.</p>
      )}
    </div>
  );
}
