"use client";

/* PAWZO AI Assistant — scoped strictly to animal/pet topics (rejects unrelated
   questions). It adopts the selected pet's species personality, and its
   suggestions + nutrition advice are tailored to the pet's type, breed, region
   and age. Frontend assistant (rule-based) — no demo conversation persisted. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, T, IconSpark } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, ageFromDob, type Pet } from "../lib/store";

type Msg = { id: number; role: "ai" | "user"; text: string };

const PERSONA: Record<string, { call: string; voice: string }> = {
  Dog: { call: "Woof!", voice: "loyal and playful" },
  Cat: { call: "Meow~", voice: "calm and a little aloof" },
  Bird: { call: "Tweet tweet!", voice: "chirpy and curious" },
  Rabbit: { call: "*nose twitch*", voice: "gentle and quick" },
  Fish: { call: "*blub blub*", voice: "serene" },
  Reptile: { call: "*slow blink*", voice: "cool and deliberate" },
  Hamster: { call: "*squeak*", voice: "busy and snuggly" },
  "Guinea pig": { call: "*wheek!*", voice: "social and chatty" },
};

const ANIMAL_WORDS = ["eat", "food", "feed", "diet", "meal", "treat", "vaccine", "vaccination", "shot", "vet", "health", "sick", "ill", "vomit", "weight", "groom", "bath", "walk", "exercise", "play", "behav", "anxious", "bark", "meow", "bite", "train", "litter", "cage", "tank", "fur", "coat", "paw", "claw", "nail", "teeth", "flea", "tick", "worm", "breed", "puppy", "kitten", "pet", "animal", "nutrition", "calorie", "water", "sleep", "emergency", "first aid"];

function isAnimalRelated(q: string, pet: Pet | null): boolean {
  const s = q.toLowerCase();
  if (pet && s.includes(pet.name.toLowerCase())) return true;
  if (pet && s.includes(pet.species.toLowerCase())) return true;
  const animals = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "hamster", "puppy", "kitten", "parrot", "turtle", "snake"];
  if (animals.some((a) => s.includes(a))) return true;
  return ANIMAL_WORDS.some((w) => s.includes(w));
}

function regionalFoods(region: string): string {
  const map: Record<string, string> = {
    "South Asia": "rice, lentils, curd, pumpkin and boiled chicken",
    "North America": "turkey, brown rice, blueberries and green beans",
    "Europe": "salmon, oats, carrots and pumpkin",
    "East Asia": "white fish, sweet potato, rice and spinach",
    "Southeast Asia": "chicken, papaya, rice and leafy greens",
    "Middle East": "lamb, rice, yoghurt and zucchini",
    "Africa": "maize, beef, pumpkin and spinach",
    "South America": "quinoa, chicken, squash and beans",
    "Oceania": "kangaroo, lamb, rice and peas",
  };
  return map[region] || "lean protein, whole grains and fresh vegetables";
}

function buildReply(q: string, pet: Pet | null): string {
  if (!isAnimalRelated(q, pet)) {
    return "I'm your pet-care helper, so I can only chat about animals and their wellbeing 🐾 Try asking me about food, health, grooming or behaviour.";
  }
  const s = q.toLowerCase();
  const species = pet?.species ?? "Dog";
  const persona = PERSONA[species] ?? { call: "Hi!", voice: "friendly" };
  const name = pet?.name ?? "your pet";
  const lead = `${persona.call} `;

  if (/chocolate|grape|onion|xylitol|toxic|poison/.test(s))
    return `${lead}Please keep chocolate, grapes, onions and xylitol away from ${name} — they're toxic. If you think ${name} ate any, open Emergency and call your vet right away.`;

  if (/eat|food|feed|diet|meal|nutrition|menu|recipe/.test(s)) {
    const foods = regionalFoods(pet?.region || "");
    const age = pet ? ageFromDob(pet.dob) : "";
    return `${lead}For a ${age ? age + " " : ""}${pet?.breed || species}, I'd build meals around ${foods}. Split into 2–3 portions a day and keep treats under 10% of calories. Want me to turn this into a daily menu in the Food tab?`;
  }
  if (/vaccine|vaccination|shot/.test(s))
    return `${lead}Check the Health tab for ${name}'s vaccination schedule — I'll flag anything due soon. Most ${species.toLowerCase()}s need annual boosters; your vet sets the exact plan.`;
  if (/anxious|scared|behav|bark|meow|bite|aggress/.test(s))
    return `${lead}${name} is ${persona.voice} by nature. Keep a steady routine, reward calm behaviour, and give a quiet safe space. If it suddenly changes, a vet check rules out pain.`;
  if (/groom|bath|fur|coat|nail|claw/.test(s))
    return `${lead}Regular gentle grooming keeps ${name} comfy — brush a few times a week and trim nails carefully. Use only pet-safe products.`;
  if (/walk|exercise|play/.test(s))
    return `${lead}Daily activity keeps ${name} happy and at a healthy weight. Mix movement with enrichment — even sniffing or foraging counts!`;
  if (/emergency|hurt|bleeding|vomit|sick|ill/.test(s))
    return `${lead}If this feels urgent, open the Emergency screen to call your saved vet now. Keep ${name} calm and warm while you reach help.`;
  if (/weight/.test(s))
    return `${lead}Log ${name}'s weight in the Health tab and I'll chart the trend. Steady is good — sudden gain or loss is worth a vet chat.`;
  return `${lead}Happy to help with ${name}'s care — food, health, grooming, behaviour or emergencies. What would you like to know?`;
}

function suggestionsFor(pet: Pet | null): string[] {
  if (!pet) return ["What should I feed my pet?", "How often should I groom?", "Is my pet a healthy weight?"];
  const sp = pet.species;
  const base = [`What should ${pet.name} eat?`, `Is ${pet.breed || sp} prone to any health issues?`];
  const bySpecies: Record<string, string[]> = {
    Dog: ["How much exercise does my dog need?", "Why is my dog barking a lot?"],
    Cat: ["Why is my cat scratching furniture?", "How often should I clean the litter box?"],
    Bird: ["What fruits are safe for my bird?", "Why is my bird plucking feathers?"],
    Rabbit: ["How much hay does my rabbit need?", "Is my rabbit's cage big enough?"],
    Fish: ["How often should I change the tank water?", "What's the ideal water temperature?"],
    Reptile: ["What basking temperature is best?", "How often should my reptile eat?"],
  };
  return [...base, ...(bySpecies[sp] ?? ["How do I keep my pet happy?"])].slice(0, 4);
}

export default function AIPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { selectedPet } = usePawzo();
  const pet = ready ? selectedPet() : null;

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const who = pet ? `${pet.name} the ${pet.species.toLowerCase()}` : "your pet";
    setMsgs([{ id: 0, role: "ai", text: `Hi! I'm Pawzo AI 🐾 Ask me anything about ${who}'s care — food, health, behaviour or reminders. I only talk about animals!` }]);
  }, [ready, pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  if (!ready || !authed) return null;

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, role: "user", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: id + 1, role: "ai", text: buildReply(t, pet) }]); }, 850);
  }

  const suggestions = suggestionsFor(pet);

  return (
    <AppFrame bg="var(--p-surface-2)">
      <TopBar back="/dashboard" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 12px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.pink, display: "flex", alignItems: "center", justifyContent: "center" }}><IconSpark color="#fff" size={24} /></div>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: T.ink, margin: 0 }}>Pawzo AI</h1>
          <p style={{ fontSize: 11.5, color: T.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.success, display: "inline-block" }} /> {pet ? `Helping with ${pet.name}` : "Animal care only"}
          </p>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m) => (
          <div key={m.id} className="pawzo-pop" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "ai" && <span style={{ fontSize: 20, marginRight: 6, alignSelf: "flex-end" }}>🐾</span>}
            <div style={{ maxWidth: "78%", padding: "11px 14px", borderRadius: 18, borderBottomRightRadius: m.role === "user" ? 6 : 18, borderBottomLeftRadius: m.role === "ai" ? 6 : 18, background: m.role === "user" ? T.pink : "var(--p-surface)", color: m.role === "user" ? "#fff" : T.ink, fontSize: 14, lineHeight: 1.5, boxShadow: T.shadowSoft }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="pawzo-pop" style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 20 }}>🐾</span>
            <div style={{ background: "var(--p-surface)", borderRadius: 18, borderBottomLeftRadius: 6, padding: "13px 16px", boxShadow: T.shadowSoft, display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.pink, animation: `pawzo-dot 1.2s ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 8px" }}>
        {suggestions.map((sg) => (
          <button key={sg} onClick={() => send(sg)} className="pawzo-press" style={{ flexShrink: 0, background: "var(--p-surface)", border: "1.5px solid var(--p-border)", borderRadius: 20, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: T.pinkDeep, cursor: "pointer", whiteSpace: "nowrap" }}>{sg}</button>
        ))}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: T.maxW, background: "var(--p-nav)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--p-border)", padding: "10px 16px max(12px, env(safe-area-inset-bottom))", display: "flex", gap: 8, zIndex: 100 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder={pet ? `Ask about ${pet.name}…` : "Ask about your pet…"} style={{ flex: 1, height: 46, padding: "0 16px", borderRadius: 23, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 14, outline: "none", color: T.ink }} />
        <button onClick={() => send(input)} className="pawzo-press" aria-label="Send" style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: T.pink, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </button>
      </div>
    </AppFrame>
  );
}
