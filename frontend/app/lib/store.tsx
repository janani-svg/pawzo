"use client";

/* =========================================================================
   PAWZO data store
   ---------------------------------------------------------------------------
   Single source of truth for the whole app. Persists to localStorage so every
   user-entered record survives a refresh. No demo / sample data — the app
   starts empty and only shows what the user creates. Provides real CRUD for
   accounts, pets, menus + meal logs, vaccinations, weights, health records,
   expenses + receipts, milestones, memories, calendar events, the preferred
   vet, settings and an activity-derived streak.
   ========================================================================= */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ----------------------------------------------------------------- types */
export type Account = { id: string; name: string; username: string; email: string; password: string };

export type Pet = {
  id: string;
  ownerId: string;
  name: string;
  species: string;       // Dog / Cat / Bird / ... / custom
  breed: string;
  gender: "male" | "female" | "unknown";
  dob: string;           // yyyy-mm-dd
  weight: string;        // kg (string as entered)
  photo: string;         // data URL or ""
  region: string;
  notes: string;
  createdAt: number;
};

export type Meal = { id: string; petId: string; name: string; time: string; food: string; kcal: number };
export type MealLog = { id: string; petId: string; date: string; mealId: string; done: boolean };
export type Vaccination = { id: string; petId: string; name: string; date: string; nextDue: string; clinic: string };
export type WeightEntry = { id: string; petId: string; weight: number; date: string; note: string };
export type HealthRecord = {
  id: string; petId: string; kind: "vet" | "medication";
  title: string; detail: string; date: string; active?: boolean;
};
export type Expense = {
  id: string; petId: string; category: string; amount: number; date: string;
  note: string; receipt: string; // data URL or ""
};
export type Milestone = { id: string; petId: string; emoji: string; title: string; date: string };
export type Memory = { id: string; petId: string; photo: string; caption: string; date: string };
export type CalendarEvent = { id: string; petId: string; title: string; date: string; emoji: string };
export type Vet = { name: string; clinic: string; phone: string; altPhone: string; address: string } | null;
export type Settings = {
  theme: "light" | "dark" | "auto";
  push: boolean; email: boolean; sound: boolean;
  units: "metric" | "imperial"; currency: string; language: string;
};

export type State = {
  accounts: Account[];
  currentUserId: string | null;
  selectedPetId: string | null;
  pets: Pet[];
  meals: Meal[];
  mealLogs: MealLog[];
  vaccinations: Vaccination[];
  weights: WeightEntry[];
  health: HealthRecord[];
  expenses: Expense[];
  milestones: Milestone[];
  memories: Memory[];
  events: CalendarEvent[];
  vet: Vet;
  settings: Settings;
  activity: string[]; // ISO dates with activity (for streak)
};

const EMPTY: State = {
  accounts: [],
  currentUserId: null,
  selectedPetId: null,
  pets: [],
  meals: [],
  mealLogs: [],
  vaccinations: [],
  weights: [],
  health: [],
  expenses: [],
  milestones: [],
  memories: [],
  events: [],
  vet: null,
  settings: { theme: "light", push: true, email: false, sound: true, units: "metric", currency: "USD", language: "English" },
  activity: [],
};

const KEY = "pawzo:v2";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const todayISO = () => new Date().toISOString().slice(0, 10);

/* ----------------------------------------------------------------- context */
type Ctx = {
  ready: boolean;
  state: State;
  // auth
  register: (a: Omit<Account, "id">) => { ok: boolean; error?: string };
  login: (idOrEmail: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => { ok: boolean; error?: string };
  currentUser: () => Account | null;
  // pets
  addPet: (p: Omit<Pet, "id" | "ownerId" | "createdAt">) => string;
  updatePet: (id: string, patch: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  selectPet: (id: string) => void;
  myPets: () => Pet[];
  selectedPet: () => Pet | null;
  // generic per-collection helpers
  add: <K extends CollKey>(coll: K, item: Omit<State[K] extends (infer U)[] ? U : never, "id">) => string;
  update: <K extends CollKey>(coll: K, id: string, patch: Partial<State[K] extends (infer U)[] ? U : never>) => void;
  remove: <K extends CollKey>(coll: K, id: string) => void;
  // misc
  toggleMealLog: (petId: string, mealId: string, date: string) => void;
  setVet: (v: Vet) => void;
  setSettings: (patch: Partial<Settings>) => void;
  recordActivity: () => void;
  streak: () => number;
};

type CollKey = "meals" | "mealLogs" | "vaccinations" | "weights" | "health" | "expenses" | "milestones" | "memories" | "events";

const PawzoCtx = createContext<Ctx | null>(null);

export function PawzoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const saveRef = useRef<State>(EMPTY);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...(parsed.settings ?? {}) } });
      }
    } catch {}
    setReady(true);
  }, []);

  // persist on change
  useEffect(() => {
    saveRef.current = state;
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, ready]);

  // apply theme
  useEffect(() => {
    if (!ready) return;
    const t = state.settings.theme;
    const dark = t === "dark" || (t === "auto" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [state.settings.theme, ready]);

  const api = useMemo<Ctx>(() => {
    const mutate = (fn: (s: State) => State) => setState((s) => fn(structuredCloneSafe(s)));

    const recordActivity = () =>
      mutate((s) => {
        const d = todayISO();
        if (!s.activity.includes(d)) s.activity = [...s.activity, d];
        return s;
      });

    return {
      ready,
      state,

      register: (a) => {
        const s = saveRef.current;
        if (s.accounts.some((x) => x.email.toLowerCase() === a.email.toLowerCase()))
          return { ok: false, error: "An account with this email already exists." };
        if (s.accounts.some((x) => x.username.toLowerCase() === a.username.toLowerCase()))
          return { ok: false, error: "That username is taken." };
        const acc: Account = { ...a, id: uid() };
        mutate((st) => { st.accounts = [...st.accounts, acc]; st.currentUserId = acc.id; return st; });
        return { ok: true };
      },

      login: (idOrEmail, password) => {
        const s = saveRef.current;
        const acc = s.accounts.find(
          (x) => x.email.toLowerCase() === idOrEmail.toLowerCase() || x.username.toLowerCase() === idOrEmail.toLowerCase()
        );
        if (!acc) return { ok: false, error: "No account found. Please create one first." };
        if (acc.password !== password) return { ok: false, error: "Incorrect password. Try again." };
        mutate((st) => { st.currentUserId = acc.id; return st; });
        return { ok: true };
      },

      logout: () => mutate((st) => { st.currentUserId = null; return st; }),

      resetPassword: (email, newPassword) => {
        const s = saveRef.current;
        const acc = s.accounts.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!acc) return { ok: false, error: "No account uses that email." };
        mutate((st) => { st.accounts = st.accounts.map((x) => (x.id === acc.id ? { ...x, password: newPassword } : x)); return st; });
        return { ok: true };
      },

      currentUser: () => saveRef.current.accounts.find((a) => a.id === saveRef.current.currentUserId) ?? null,

      addPet: (p) => {
        const id = uid();
        mutate((st) => {
          const owner = st.currentUserId ?? "";
          st.pets = [...st.pets, { ...p, id, ownerId: owner, createdAt: Date.now() }];
          st.selectedPetId = id;
          const d = todayISO();
          if (!st.activity.includes(d)) st.activity = [...st.activity, d];
          return st;
        });
        return id;
      },
      updatePet: (id, patch) => mutate((st) => { st.pets = st.pets.map((p) => (p.id === id ? { ...p, ...patch } : p)); return st; }),
      deletePet: (id) => mutate((st) => {
        st.pets = st.pets.filter((p) => p.id !== id);
        (["meals","mealLogs","vaccinations","weights","health","expenses","milestones","memories","events"] as CollKey[]).forEach((k) => {
          st[k] = (st[k] as { petId: string }[]).filter((x) => x.petId !== id) as never;
        });
        if (st.selectedPetId === id) st.selectedPetId = st.pets[0]?.id ?? null;
        return st;
      }),
      selectPet: (id) => mutate((st) => { st.selectedPetId = id; return st; }),
      myPets: () => state.pets.filter((p) => p.ownerId === state.currentUserId),
      selectedPet: () => {
        const mine = state.pets.filter((p) => p.ownerId === state.currentUserId);
        return mine.find((p) => p.id === state.selectedPetId) ?? mine[0] ?? null;
      },

      add: (coll, item) => {
        const id = uid();
        mutate((st) => {
          (st[coll] as unknown[]) = [...(st[coll] as unknown[]), { ...(item as object), id }];
          const d = todayISO();
          if (!st.activity.includes(d)) st.activity = [...st.activity, d];
          return st;
        });
        return id;
      },
      update: (coll, id, patch) => mutate((st) => {
        (st[coll] as { id: string }[]) = (st[coll] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x));
        return st;
      }),
      remove: (coll, id) => mutate((st) => {
        (st[coll] as { id: string }[]) = (st[coll] as { id: string }[]).filter((x) => x.id !== id);
        return st;
      }),

      toggleMealLog: (petId, mealId, date) => mutate((st) => {
        const existing = st.mealLogs.find((l) => l.petId === petId && l.mealId === mealId && l.date === date);
        if (existing) {
          st.mealLogs = st.mealLogs.map((l) => (l.id === existing.id ? { ...l, done: !l.done } : l));
        } else {
          st.mealLogs = [...st.mealLogs, { id: uid(), petId, mealId, date, done: true }];
        }
        if (!st.activity.includes(date)) st.activity = [...st.activity, date];
        return st;
      }),

      setVet: (v) => mutate((st) => { st.vet = v; return st; }),
      setSettings: (patch) => mutate((st) => { st.settings = { ...st.settings, ...patch }; return st; }),
      recordActivity,

      streak: () => {
        const days = new Set(saveRef.current.activity);
        let count = 0;
        const d = new Date();
        // count back from today while each day has activity
        for (;;) {
          const iso = d.toISOString().slice(0, 10);
          if (days.has(iso)) { count++; d.setDate(d.getDate() - 1); }
          else break;
        }
        return count;
      },
    };
  }, [ready, state]);

  return <PawzoCtx.Provider value={api}>{children}</PawzoCtx.Provider>;
}

export function usePawzo() {
  const ctx = useContext(PawzoCtx);
  if (!ctx) throw new Error("usePawzo must be used within PawzoProvider");
  return ctx;
}

/* Redirect to /login once we know there's no signed-in account. */
export function useRequireAuth() {
  const { ready, state } = usePawzo();
  const router = useRouter();
  useEffect(() => {
    if (ready && !state.currentUserId) router.replace("/login");
  }, [ready, state.currentUserId, router]);
  return { ready, authed: !!state.currentUserId };
}

/* structuredClone fallback (older runtimes) */
function structuredCloneSafe<T>(v: T): T {
  try { return structuredClone(v); } catch { return JSON.parse(JSON.stringify(v)); }
}

/* ----------------------------------------------------------------- utils */
/* Downscale an image file to a compact data URL so localStorage stays small. */
export function fileToDataURL(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* derive real notifications from stored data (no samples) */
export type Alert = { id: string; emoji: string; title: string; body: string; when: string; group: "Today" | "Upcoming"; color: string };
export function deriveAlerts(state: State): Alert[] {
  const out: Alert[] = [];
  const today = todayISO();
  const mine = state.pets.filter((p) => p.ownerId === state.currentUserId);
  for (const pet of mine) {
    // today's meals not yet fed — personality voice
    const meals = state.meals.filter((m) => m.petId === pet.id);
    const hungryMessages = [
      `Don't you care about me? I'm hungry! 🥺`,
      `My tummy is growling... feed me please! 🍽️`,
      `Excuse me?? It's meal time! 😤`,
      `I've been waiting ALL day for this meal! 🙄`,
    ];
    for (let mi = 0; mi < meals.length; mi++) {
      const m = meals[mi];
      const log = state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today);
      if (!log?.done) out.push({ id: `meal-${m.id}`, emoji: "🍖", title: `${pet.name} is hungry!`, body: hungryMessages[mi % hungryMessages.length] + (m.time ? ` · ${m.time}` : ""), when: "Today", group: "Today", color: "#FEF3C7" });
    }
    // vaccinations due within 30 days or overdue
    for (const v of state.vaccinations.filter((v) => v.petId === pet.id && v.nextDue)) {
      const days = daysUntil(v.nextDue);
      if (days <= 30) {
        const vacMsg = days < 0
          ? `${pet.name} is overdue for ${v.name}! Book the vet ASAP 😟`
          : days === 0
            ? `${pet.name}'s ${v.name} is due today! Don't forget 💉`
            : `${pet.name} needs ${v.name} in ${days} day${days > 1 ? "s" : ""} — almost time! 🏥`;
        out.push({ id: `vac-${v.id}`, emoji: "💉", title: `${v.name} ${days < 0 ? "overdue" : "due soon"}`, body: vacMsg, when: fmtDate(v.nextDue), group: days <= 0 ? "Today" : "Upcoming", color: "#DBEAFE" });
      }
    }
    // upcoming events within 7 days
    for (const e of state.events.filter((e) => e.petId === pet.id)) {
      const days = daysUntil(e.date);
      if (days >= 0 && days <= 7) {
        const evtMsg = days === 0
          ? `Today! Don't leave ${pet.name} hanging 🥰`
          : `Coming up in ${days} day${days > 1 ? "s" : ""} — mark your calendar! 📆`;
        out.push({ id: `evt-${e.id}`, emoji: e.emoji || "📅", title: e.title, body: evtMsg, when: fmtDate(e.date), group: days === 0 ? "Today" : "Upcoming", color: "#EDE9FE" });
      }
    }
  }
  return out;
}
export function daysUntil(iso: string): number {
  const d = new Date(iso); const now = new Date(); now.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}
export function fmtDate(iso: string): string {
  const d = new Date(iso); if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* compute age string from dob */
export function ageFromDob(dob: string): string {
  if (!dob) return "—";
  const b = new Date(dob);
  if (isNaN(b.getTime())) return "—";
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months--;
  if (months < 0) return "—";
  if (months < 12) return `${months} mo`;
  const yrs = months / 12;
  return `${yrs.toFixed(1)} yrs`;
}
