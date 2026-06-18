"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi, petsApi, mealsApi, mealLogsApi, vaccinationsApi, healthApi,
  weightsApi, expensesApi, milestonesApi, memoriesApi, calendarApi, userApi,
  type ApiPet, type ApiMeal, type ApiMealLog, type ApiVaccination,
  type ApiWeightEntry, type ApiHealthRecord, type ApiExpense,
  type ApiMilestone, type ApiMemory, type ApiCalendarEvent, type ApiVet, type ApiSettings,
} from "./api";

/* ─── Frontend types (camelCase — used by all pages) ─────────────────────── */
export type Account = { id: string; name: string; username: string; email: string; password: string };

export type Pet = {
  id: string; ownerId: string; name: string; species: string; breed: string;
  gender: "male" | "female" | "unknown"; dob: string; weight: string;
  photo: string; region: string; notes: string; createdAt: number;
};
export type Meal        = { id: string; petId: string; name: string; time: string; food: string; kcal: number };
export type MealLog     = { id: string; petId: string; date: string; mealId: string; done: boolean };
export type Vaccination = { id: string; petId: string; name: string; date: string; nextDue: string; clinic: string };
export type WeightEntry = { id: string; petId: string; weight: number; date: string; note: string };
export type HealthRecord = { id: string; petId: string; kind: "vet" | "medication"; title: string; detail: string; date: string; active?: boolean };
export type Expense     = { id: string; petId: string; category: string; amount: number; date: string; note: string; receipt: string };
export type Milestone   = { id: string; petId: string; emoji: string; title: string; date: string };
export type Memory      = { id: string; petId: string; photo: string; caption: string; date: string };
export type CalendarEvent = { id: string; petId: string; title: string; date: string; emoji: string };
export type Vet         = { name: string; clinic: string; phone: string; altPhone: string; address: string } | null;
export type Settings    = { theme: "light" | "dark" | "auto"; push: boolean; email: boolean; sound: boolean; units: "metric" | "imperial"; currency: string; language: string };

export type State = {
  accounts: Account[];         // kept for type compat, not used with API
  currentUserId: string | null;
  currentUserName: string;
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
  activity: string[];
};

const EMPTY: State = {
  accounts: [], currentUserId: null, currentUserName: "", selectedPetId: null,
  pets: [], meals: [], mealLogs: [], vaccinations: [], weights: [], health: [],
  expenses: [], milestones: [], memories: [], events: [], vet: null,
  settings: { theme: "light", push: true, email: false, sound: true, units: "metric", currency: "USD", language: "English" },
  activity: [],
};

type CollKey = "meals" | "mealLogs" | "vaccinations" | "weights" | "health" | "expenses" | "milestones" | "memories" | "events";

/* ─── API ↔ Frontend converters ──────────────────────────────────────────── */
const toPet = (p: ApiPet): Pet => ({
  id: p.id, ownerId: p.owner_id, name: p.name, species: p.species ?? "",
  breed: p.breed ?? "", gender: (p.gender as Pet["gender"]) ?? "unknown",
  dob: p.dob ?? "", weight: p.weight ?? "", photo: p.photo_url ?? "",
  region: p.region ?? "", notes: p.notes ?? "",
  createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
});

const toMeal        = (m: ApiMeal):         Meal        => ({ id: m.id, petId: m.pet_id, name: m.name, time: m.time ?? "", food: m.food ?? "", kcal: m.kcal ?? 0 });
const toMealLog     = (m: ApiMealLog):      MealLog     => ({ id: m.id, petId: m.pet_id, mealId: m.meal_id, date: m.date, done: m.done });
const toVaccination = (v: ApiVaccination):  Vaccination => ({ id: v.id, petId: v.pet_id, name: v.name, date: v.date ?? "", nextDue: v.next_due ?? "", clinic: v.clinic ?? "" });
const toWeight      = (w: ApiWeightEntry):  WeightEntry => ({ id: w.id, petId: w.pet_id, weight: w.weight, date: w.date, note: w.note ?? "" });
const toHealth      = (h: ApiHealthRecord): HealthRecord => ({ id: h.id, petId: h.pet_id, kind: h.kind as "vet" | "medication", title: h.title, detail: h.detail ?? "", date: h.date ?? "", active: h.active });
const toExpense     = (e: ApiExpense):      Expense     => ({ id: e.id, petId: e.pet_id, category: e.category ?? "", amount: e.amount, date: e.date, note: e.note ?? "", receipt: e.receipt_url ?? "" });
const toMilestone   = (m: ApiMilestone):   Milestone   => ({ id: m.id, petId: m.pet_id, emoji: m.emoji ?? "", title: m.title, date: m.date });
const toMemory      = (m: ApiMemory):       Memory      => ({ id: m.id, petId: m.pet_id, photo: m.photo_url ?? "", caption: m.caption ?? "", date: m.date });
const toEvent       = (e: ApiCalendarEvent): CalendarEvent => ({ id: e.id, petId: e.pet_id, title: e.title, date: e.date, emoji: e.emoji ?? "" });
const toVet         = (v: ApiVet | null): Vet => v ? { name: v.name, clinic: v.clinic ?? "", phone: v.phone ?? "", altPhone: v.alt_phone ?? "", address: v.address ?? "" } : null;
const toSettings    = (s: ApiSettings): Settings => ({ theme: (s.theme as Settings["theme"]) ?? "light", push: s.push, email: s.email, sound: s.sound, units: (s.units as Settings["units"]) ?? "metric", currency: s.currency ?? "USD", language: s.language ?? "English" });

/* Load all data for the current user from the API */
async function loadAll(userId: string): Promise<Partial<State>> {
  const pets = (await petsApi.list()).map(toPet);
  const ids  = pets.map((p) => p.id);

  const [meals, mealLogs, vaccinations, weights, health, expenses, milestones, memories, events, vet, settings, activityRes] =
    await Promise.all([
      Promise.all(ids.map((id) => mealsApi.list(id))).then((r) => r.flat().map(toMeal)),
      Promise.all(ids.map((id) => mealLogsApi.list(id))).then((r) => r.flat().map(toMealLog)),
      Promise.all(ids.map((id) => vaccinationsApi.list(id))).then((r) => r.flat().map(toVaccination)),
      Promise.all(ids.map((id) => weightsApi.list(id))).then((r) => r.flat().map(toWeight)),
      Promise.all(ids.map((id) => healthApi.list(id))).then((r) => r.flat().map(toHealth)),
      Promise.all(ids.map((id) => expensesApi.list(id))).then((r) => r.flat().map(toExpense)),
      Promise.all(ids.map((id) => milestonesApi.list(id))).then((r) => r.flat().map(toMilestone)),
      Promise.all(ids.map((id) => memoriesApi.list(id))).then((r) => r.flat().map(toMemory)),
      Promise.all(ids.map((id) => calendarApi.list(id))).then((r) => r.flat().map(toEvent)),
      userApi.getVet().then(toVet).catch(() => null as Vet),
      userApi.getSettings().then(toSettings).catch(() => EMPTY.settings),
      userApi.getActivity().catch(() => ({ dates: [] as string[] })),
    ]);

  return {
    currentUserId: userId,
    pets,
    meals, mealLogs, vaccinations, weights, health,
    expenses, milestones, memories, events,
    vet, settings,
    activity: activityRes.dates,
    selectedPetId: pets[0]?.id ?? null,
  };
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
type Ctx = {
  ready: boolean;
  state: State;
  register:      (a: { name: string; username: string; email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  login:         (idOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout:        () => void;
  resetPassword: (email: string, newPassword: string) => { ok: boolean; error?: string };
  currentUser:   () => { id: string; name: string; username: string; email: string } | null;
  addPet:        (p: Omit<Pet, "id" | "ownerId" | "createdAt">) => Promise<string>;
  updatePet:     (id: string, patch: Partial<Pet>) => void;
  deletePet:     (id: string) => void;
  selectPet:     (id: string) => void;
  myPets:        () => Pet[];
  selectedPet:   () => Pet | null;
  add:           <K extends CollKey>(coll: K, item: Omit<State[K] extends (infer U)[] ? U : never, "id">) => Promise<string>;
  update:        <K extends CollKey>(coll: K, id: string, patch: Partial<State[K] extends (infer U)[] ? U : never>) => void;
  remove:        <K extends CollKey>(coll: K, id: string) => void;
  toggleMealLog: (petId: string, mealId: string, date: string) => void;
  setVet:        (v: Vet) => void;
  setSettings:   (patch: Partial<Settings>) => void;
  recordActivity: () => void;
  streak:        () => number;
};

const PawzoCtx = createContext<Ctx | null>(null);

export function PawzoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<State>(EMPTY);

  const mutate = (fn: (s: State) => State) =>
    setState((s) => { const next = fn({ ...s }); stateRef.current = next; return next; });

  /* Apply theme */
  useEffect(() => {
    if (!ready) return;
    const t = state.settings.theme;
    const dark = t === "dark" || (t === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [state.settings.theme, ready]);

  /* Bootstrap: load from API if token exists */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("pawzo:token") : null;
    if (!token) { setReady(true); return; }

    authApi.me()
      .then((user) => loadAll(user.id).then((data) => {
        mutate((s) => ({ ...s, ...data, currentUserName: user.name }));
        setReady(true);
      }))
      .catch(() => {
        localStorage.removeItem("pawzo:token");
        setReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api: Ctx = useMemo(() => ({
    ready,
    state,

    /* ── Auth ─────────────────────────────────────────────────────────── */
    register: async ({ name, username, email, password }) => {
      try {
        const res = await authApi.register({ name, username, email, password });
        localStorage.setItem("pawzo:token", res.access_token);
        const data = await loadAll(res.user.id);
        mutate((s) => ({ ...s, ...data, currentUserName: res.user.name }));
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message };
      }
    },

    login: async (idOrEmail, password) => {
      try {
        const res = await authApi.login({ identifier: idOrEmail, password });
        localStorage.setItem("pawzo:token", res.access_token);
        const data = await loadAll(res.user.id);
        mutate((s) => ({ ...s, ...data, currentUserName: res.user.name }));
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message };
      }
    },

    logout: () => {
      localStorage.removeItem("pawzo:token");
      mutate(() => ({ ...EMPTY }));
    },

    resetPassword: () => ({ ok: false, error: "Password reset via email — coming soon." }),

    currentUser: () => {
      const s = stateRef.current;
      if (!s.currentUserId) return null;
      return { id: s.currentUserId, name: s.currentUserName, username: "", email: "" };
    },

    /* ── Pets ──────────────────────────────────────────────────────────── */
    addPet: async (p) => {
      const res = await petsApi.create({
        name: p.name, species: p.species, breed: p.breed, gender: p.gender,
        dob: p.dob, weight: p.weight, photo_url: p.photo, region: p.region, notes: p.notes,
      });
      const pet = toPet(res);
      mutate((s) => ({ ...s, pets: [...s.pets, pet], selectedPetId: pet.id, activity: addToday(s.activity) }));
      userApi.recordActivity().catch(() => {});
      return pet.id;
    },

    updatePet: (id, patch) => {
      mutate((s) => ({ ...s, pets: s.pets.map((p) => p.id === id ? { ...p, ...patch } : p) }));
      const apiPatch: Partial<ApiPet> = {};
      if (patch.name     !== undefined) apiPatch.name      = patch.name;
      if (patch.species  !== undefined) apiPatch.species   = patch.species;
      if (patch.breed    !== undefined) apiPatch.breed     = patch.breed;
      if (patch.gender   !== undefined) apiPatch.gender    = patch.gender;
      if (patch.dob      !== undefined) apiPatch.dob       = patch.dob;
      if (patch.weight   !== undefined) apiPatch.weight    = patch.weight;
      if (patch.photo    !== undefined) apiPatch.photo_url = patch.photo;
      if (patch.region   !== undefined) apiPatch.region    = patch.region;
      if (patch.notes    !== undefined) apiPatch.notes     = patch.notes;
      petsApi.update(id, apiPatch).catch(console.error);
    },

    deletePet: (id) => {
      mutate((s) => ({
        ...s,
        pets: s.pets.filter((p) => p.id !== id),
        selectedPetId: s.selectedPetId === id ? (s.pets.find((p) => p.id !== id)?.id ?? null) : s.selectedPetId,
        meals: s.meals.filter((x) => x.petId !== id),
        mealLogs: s.mealLogs.filter((x) => x.petId !== id),
        vaccinations: s.vaccinations.filter((x) => x.petId !== id),
        weights: s.weights.filter((x) => x.petId !== id),
        health: s.health.filter((x) => x.petId !== id),
        expenses: s.expenses.filter((x) => x.petId !== id),
        milestones: s.milestones.filter((x) => x.petId !== id),
        memories: s.memories.filter((x) => x.petId !== id),
        events: s.events.filter((x) => x.petId !== id),
      }));
      petsApi.delete(id).catch(console.error);
    },

    selectPet: (id) => mutate((s) => ({ ...s, selectedPetId: id })),

    myPets: () => stateRef.current.pets,

    selectedPet: () => {
      const s = stateRef.current;
      return s.pets.find((p) => p.id === s.selectedPetId) ?? s.pets[0] ?? null;
    },

    /* ── Generic CRUD ──────────────────────────────────────────────────── */
    add: async (coll, item) => {
      const { petId, ...rest } = item as { petId: string } & Record<string, unknown>;
      const [apiRes, id] = await callCreate(coll, petId, rest);
      const converted = convertFromApi(coll, petId, apiRes);
      mutate((s) => ({
        ...s,
        [coll]: [...(s[coll] as unknown[]), converted],
        activity: addToday(s.activity),
      }));
      userApi.recordActivity().catch(() => {});
      return id;
    },

    update: (coll, id, patch) => {
      mutate((s) => ({
        ...s,
        [coll]: (s[coll] as { id: string }[]).map((x) => x.id === id ? { ...x, ...patch } : x),
      }));
      const item = stateRef.current[coll].find((x: { id: string }) => x.id === id) as { petId: string } | undefined;
      if (item) callUpdate(coll, item.petId, id, patch).catch(console.error);
    },

    remove: (coll, id) => {
      const item = stateRef.current[coll].find((x: { id: string }) => x.id === id) as { petId: string } | undefined;
      mutate((s) => ({
        ...s,
        [coll]: (s[coll] as { id: string }[]).filter((x) => x.id !== id),
      }));
      if (item) callDelete(coll, item.petId, id).catch(console.error);
    },

    /* ── Meal log toggle ────────────────────────────────────────────────── */
    toggleMealLog: (petId, mealId, date) => {
      mutate((s) => {
        const existing = s.mealLogs.find((l) => l.petId === petId && l.mealId === mealId && l.date === date);
        const mealLogs = existing
          ? s.mealLogs.map((l) => l.id === existing.id ? { ...l, done: !l.done } : l)
          : [...s.mealLogs, { id: `tmp-${Date.now()}`, petId, mealId, date, done: true }];
        return { ...s, mealLogs, activity: addToday(s.activity) };
      });
      mealLogsApi.toggle(petId, mealId, date)
        .then((log) => {
          mutate((s) => ({
            ...s,
            mealLogs: s.mealLogs.some((l) => l.petId === petId && l.mealId === mealId && l.date === date && !l.id.startsWith("tmp"))
              ? s.mealLogs.map((l) => l.petId === petId && l.mealId === mealId && l.date === date ? toMealLog(log) : l)
              : [...s.mealLogs.filter((l) => !(l.id.startsWith("tmp") && l.petId === petId && l.mealId === mealId && l.date === date)), toMealLog(log)],
          }));
        })
        .catch(console.error);
    },

    /* ── Settings & Vet ─────────────────────────────────────────────────── */
    setVet: (v) => {
      mutate((s) => ({ ...s, vet: v }));
      if (v) userApi.upsertVet({ name: v.name, clinic: v.clinic, phone: v.phone, alt_phone: v.altPhone, address: v.address }).catch(console.error);
      else   userApi.deleteVet().catch(console.error);
    },

    setSettings: (patch) => {
      mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
      userApi.updateSettings(patch as Partial<ApiSettings>).catch(console.error);
    },

    recordActivity: () => {
      mutate((s) => ({ ...s, activity: addToday(s.activity) }));
      userApi.recordActivity().catch(() => {});
    },

    streak: () => {
      const days = new Set(stateRef.current.activity);
      let count = 0;
      const d = new Date();
      for (;;) {
        const iso = d.toISOString().slice(0, 10);
        if (days.has(iso)) { count++; d.setDate(d.getDate() - 1); } else break;
      }
      return count;
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ready, state]);

  return <PawzoCtx.Provider value={api}>{children}</PawzoCtx.Provider>;
}

export function usePawzo() {
  const ctx = useContext(PawzoCtx);
  if (!ctx) throw new Error("usePawzo must be used within PawzoProvider");
  return ctx;
}

export function useRequireAuth() {
  const { ready, state } = usePawzo();
  const router = useRouter();
  useEffect(() => {
    if (ready && !state.currentUserId) router.replace("/login");
  }, [ready, state.currentUserId, router]);
  return { ready, authed: !!state.currentUserId };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function addToday(activity: string[]): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return activity.includes(today) ? activity : [...activity, today];
}

const COLL_ROUTE: Record<CollKey, string> = {
  meals: "meals", mealLogs: "meal-logs", vaccinations: "vaccinations",
  weights: "weights", health: "health", expenses: "expenses",
  milestones: "milestones", memories: "memories", events: "events",
};

/* Convert frontend item fields → API body (snake_case) */
function toApiBody(coll: CollKey, item: Record<string, unknown>): Record<string, unknown> {
  const body = { ...item };
  delete body.petId;
  // Field renames
  if (coll === "vaccinations" && "nextDue" in body) { body.next_due = body.nextDue; delete body.nextDue; }
  if (coll === "expenses"     && "receipt" in body) { body.receipt_url = body.receipt; delete body.receipt; }
  if (coll === "memories"     && "photo"   in body) { body.photo_url   = body.photo;   delete body.photo; }
  if (coll === "mealLogs"     && "mealId"  in body) { body.meal_id     = body.mealId;  delete body.mealId; }
  return body;
}

/* Convert API response → frontend type */
function convertFromApi(coll: CollKey, petId: string, res: Record<string, unknown>): unknown {
  const base = { ...res, petId: res.pet_id ?? petId };
  delete (base as Record<string, unknown>).pet_id;
  if (coll === "vaccinations") { base.nextDue = res.next_due ?? ""; delete (base as Record<string, unknown>).next_due; }
  if (coll === "expenses")     { base.receipt = res.receipt_url ?? ""; delete (base as Record<string, unknown>).receipt_url; }
  if (coll === "memories")     { base.photo   = res.photo_url ?? "";   delete (base as Record<string, unknown>).photo_url; }
  if (coll === "mealLogs")     { base.mealId  = res.meal_id ?? "";     delete (base as Record<string, unknown>).meal_id; }
  return base;
}

async function callCreate(coll: CollKey, petId: string, body: Record<string, unknown>): Promise<[Record<string, unknown>, string]> {
  const route = COLL_ROUTE[coll];
  const apiBody = toApiBody(coll, { ...body, petId });
  let res: Record<string, unknown>;
  switch (coll) {
    case "meals":         res = await mealsApi.create(petId, apiBody as never);         break;
    case "vaccinations":  res = await vaccinationsApi.create(petId, apiBody as never);  break;
    case "weights":       res = await weightsApi.create(petId, apiBody as never);       break;
    case "health":        res = await healthApi.create(petId, apiBody as never);        break;
    case "expenses":      res = await expensesApi.create(petId, apiBody as never);      break;
    case "milestones":    res = await milestonesApi.create(petId, apiBody as never);    break;
    case "memories":      res = await memoriesApi.create(petId, apiBody as never);      break;
    case "events":        res = await calendarApi.create(petId, apiBody as never);      break;
    default:
      throw new Error(`No create route for ${route}`);
  }
  return [res as Record<string, unknown>, res.id as string];
}

async function callUpdate(coll: CollKey, petId: string, id: string, patch: Record<string, unknown>): Promise<void> {
  const apiPatch = toApiBody(coll, { ...patch, petId });
  switch (coll) {
    case "meals":         await mealsApi.update(petId, id, apiPatch as never);         break;
    case "vaccinations":  await vaccinationsApi.update(petId, id, apiPatch as never);  break;
    case "weights":       await weightsApi.update(petId, id, apiPatch as never);       break;
    case "health":        await healthApi.update(petId, id, apiPatch as never);        break;
    case "expenses":      await expensesApi.update(petId, id, apiPatch as never);      break;
    case "milestones":    await milestonesApi.update(petId, id, apiPatch as never);    break;
    case "memories":      await memoriesApi.update(petId, id, apiPatch as never);      break;
    case "events":        await calendarApi.update(petId, id, apiPatch as never);      break;
  }
}

async function callDelete(coll: CollKey, petId: string, id: string): Promise<void> {
  switch (coll) {
    case "meals":         await mealsApi.delete(petId, id);         break;
    case "vaccinations":  await vaccinationsApi.delete(petId, id);  break;
    case "weights":       await weightsApi.delete(petId, id);       break;
    case "health":        await healthApi.delete(petId, id);        break;
    case "expenses":      await expensesApi.delete(petId, id);      break;
    case "milestones":    await milestonesApi.delete(petId, id);    break;
    case "memories":      await memoriesApi.delete(petId, id);      break;
    case "events":        await calendarApi.delete(petId, id);      break;
  }
}

/* ─── Utilities (re-exported for pages) ──────────────────────────────────── */
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function fileToDataURL(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
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

export type Alert = { id: string; emoji: string; title: string; body: string; when: string; group: "Today" | "Upcoming"; color: string };

export function deriveAlerts(state: State): Alert[] {
  const out: Alert[] = [];
  const today = todayISO();
  for (const pet of state.pets) {
    const meals = state.meals.filter((m) => m.petId === pet.id);
    const hungryMessages = [`Don't you care about me? I'm hungry! 🥺`, `My tummy is growling... feed me please! 🍽️`, `Excuse me?? It's meal time! 😤`, `I've been waiting ALL day for this meal! 🙄`];
    for (let mi = 0; mi < meals.length; mi++) {
      const m = meals[mi];
      const log = state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today);
      if (!log?.done) out.push({ id: `meal-${m.id}`, emoji: "🍖", title: `${pet.name} is hungry!`, body: hungryMessages[mi % hungryMessages.length] + (m.time ? ` · ${m.time}` : ""), when: "Today", group: "Today", color: "#FEF3C7" });
    }
    for (const v of state.vaccinations.filter((v) => v.petId === pet.id && v.nextDue)) {
      const days = daysUntil(v.nextDue);
      if (days <= 30) out.push({ id: `vac-${v.id}`, emoji: "💉", title: `${v.name} ${days < 0 ? "overdue" : "due soon"}`, body: days < 0 ? `${pet.name} is overdue for ${v.name}! Book the vet ASAP 😟` : `${pet.name} needs ${v.name} in ${days} day${days > 1 ? "s" : ""} 🏥`, when: fmtDate(v.nextDue), group: days <= 0 ? "Today" : "Upcoming", color: "#DBEAFE" });
    }
    for (const e of state.events.filter((e) => e.petId === pet.id)) {
      const days = daysUntil(e.date);
      if (days >= 0 && days <= 7) out.push({ id: `evt-${e.id}`, emoji: e.emoji || "📅", title: e.title, body: days === 0 ? `Today! Don't leave ${pet.name} hanging 🥰` : `Coming up in ${days} day${days > 1 ? "s" : ""} 📆`, when: fmtDate(e.date), group: days === 0 ? "Today" : "Upcoming", color: "#EDE9FE" });
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

export function ageFromDob(dob: string): string {
  if (!dob) return "—";
  const b = new Date(dob);
  if (isNaN(b.getTime())) return "—";
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months--;
  if (months < 0) return "—";
  if (months < 12) return `${months} mo`;
  return `${(months / 12).toFixed(1)} yrs`;
}
