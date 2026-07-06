"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi, petsApi, mealsApi, mealLogsApi, vaccinationsApi, healthApi,
  weightsApi, expensesApi, milestonesApi, memoriesApi, calendarApi, environmentApi, userApi, documentsApi, alertsApi,
  type ApiPet, type ApiMeal, type ApiMealLog, type ApiVaccination,
  type ApiWeightEntry, type ApiHealthRecord, type ApiExpense,
  type ApiMilestone, type ApiMemory, type ApiCalendarEvent, type ApiEnvironmentTask, type ApiVet, type ApiSettings, type ApiDocument,
  type ApiAlertRecord, type ApiAlertRecordIn,
} from "./api";

/* ─── Frontend types (camelCase — used by all pages) ─────────────────────── */
export type Account = { id: string; name: string; username: string; email: string; password: string };

export type Pet = {
  id: string; ownerId: string; name: string; species: string; breed: string;
  gender: "male" | "female" | "unknown"; dob: string; weight: string;
  photo: string; region: string; notes: string; createdAt: number;
};
export type Meal        = { id: string; petId: string; name: string; time: string; food: string; kcal: number; recipe: string };
export type MealLog     = { id: string; petId: string; date: string; mealId: string; done: boolean; fedAt?: number };
export type Vaccination = { id: string; petId: string; name: string; date: string; nextDue: string; clinic: string };
export type WeightEntry = { id: string; petId: string; weight: number; date: string; note: string };
export type HealthRecord = { id: string; petId: string; kind: "vet" | "medication"; title: string; detail: string; date: string; active?: boolean };
export type Expense     = { id: string; petId: string; category: string; amount: number; date: string; note: string; receipt: string };
export type Milestone   = { id: string; petId: string; emoji: string; title: string; date: string };
export type Memory      = { id: string; petId: string; photo: string; caption: string; date: string; title: string; mood: string; tags: string; mediaType: string; timeTaken: string };
export type CalendarEvent = { id: string; petId: string; title: string; date: string; time: string; allDay: boolean; emoji: string };
export type EnvTask     = { id: string; petId: string; name: string; frequency: string; intervalDays: number; lastCompleted: string; nextDue: string };
export type Vet         = { name: string; clinic: string; phone: string; altPhone: string; address: string } | null;
export type Document    = { id: string; name: string; category: string; fileData: string; mimeType: string; uploadedAt: string };
export type Settings    = { theme: "light" | "dark" | "auto"; push: boolean; email: boolean; sound: boolean; units: "metric" | "imperial"; currency: string; language: string };

export type State = {
  accounts: Account[];         // kept for type compat, not used with API
  currentUserId: string | null;
  currentUserName: string;
  currentUserUsername: string;
  currentUserEmail: string;
  currentUserPhoto: string;
  emailVerified: boolean;
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
  environment: EnvTask[];
  vet: Vet;
  documents: Document[];
  settings: Settings;
  activity: string[];
  streakCount: number;
  streakBroken: boolean;
  pastAlerts: Alert[];
};

const EMPTY: State = {
  accounts: [], currentUserId: null, currentUserName: "", currentUserUsername: "", currentUserEmail: "", currentUserPhoto: "", emailVerified: false, selectedPetId: null,
  pets: [], meals: [], mealLogs: [], vaccinations: [], weights: [], health: [],
  expenses: [], milestones: [], memories: [], events: [], environment: [], vet: null, documents: [],
  settings: { theme: "light", push: true, email: false, sound: true, units: "metric", currency: "USD", language: "English" },
  activity: [], streakCount: 0, streakBroken: false,
  pastAlerts: [],
};

type CollKey = "meals" | "mealLogs" | "vaccinations" | "weights" | "health" | "expenses" | "milestones" | "memories" | "events" | "environment";

/* ─── API ↔ Frontend converters ──────────────────────────────────────────── */
const toPet = (p: ApiPet): Pet => ({
  id: p.id, ownerId: p.owner_id, name: p.name, species: p.species ?? "",
  breed: p.breed ?? "", gender: (p.gender as Pet["gender"]) ?? "unknown",
  dob: p.dob ?? "", weight: p.weight ?? "", photo: p.photo_url ?? "",
  region: p.region ?? "", notes: p.notes ?? "",
  createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
});

const toMeal        = (m: ApiMeal):         Meal        => ({ id: m.id, petId: m.pet_id, name: m.name, time: m.time ?? "", food: m.food ?? "", kcal: m.kcal ?? 0, recipe: m.recipe ?? "" });
const toMealLog     = (r: ApiMealLog):      MealLog     => ({ id: r.id, petId: r.pet_id, mealId: r.meal_id, date: r.date, done: r.done, fedAt: r.fed_at ?? undefined });
const toVaccination = (v: ApiVaccination):  Vaccination => ({ id: v.id, petId: v.pet_id, name: v.name, date: v.date ?? "", nextDue: v.next_due ?? "", clinic: v.clinic ?? "" });
const toWeight      = (w: ApiWeightEntry):  WeightEntry => ({ id: w.id, petId: w.pet_id, weight: w.weight, date: w.date, note: w.note ?? "" });
const toHealth      = (h: ApiHealthRecord): HealthRecord => ({ id: h.id, petId: h.pet_id, kind: h.kind as "vet" | "medication", title: h.title, detail: h.detail ?? "", date: h.date ?? "", active: h.active });
const toExpense     = (e: ApiExpense):      Expense     => ({ id: e.id, petId: e.pet_id, category: e.category ?? "", amount: e.amount, date: e.date, note: e.note ?? "", receipt: e.receipt_url ?? "" });
const toMilestone   = (m: ApiMilestone):   Milestone   => ({ id: m.id, petId: m.pet_id, emoji: m.emoji ?? "", title: m.title, date: m.date });
const toMemory      = (m: ApiMemory):       Memory      => ({ id: m.id, petId: m.pet_id, photo: m.photo_url ?? "", caption: m.caption ?? "", date: m.date, title: m.title ?? "", mood: m.mood ?? "", tags: m.tags ?? "", mediaType: m.media_type ?? "photo", timeTaken: m.time_taken ?? "" });
const toEvent       = (e: ApiCalendarEvent): CalendarEvent => ({ id: e.id, petId: e.pet_id, title: e.title, date: e.date, time: e.time ?? "", allDay: e.all_day ?? false, emoji: e.emoji ?? "" });
const toEnvTask     = (t: ApiEnvironmentTask): EnvTask => ({ id: t.id, petId: t.pet_id, name: t.name, frequency: t.frequency ?? "Weekly", intervalDays: t.interval_days ?? 7, lastCompleted: t.last_completed ?? "", nextDue: t.next_due ?? "" });
const toVet         = (v: ApiVet | null): Vet => v ? { name: v.name, clinic: v.clinic ?? "", phone: v.phone ?? "", altPhone: v.alt_phone ?? "", address: v.address ?? "" } : null;
const toDocument    = (d: ApiDocument): Document => ({ id: d.id, name: d.name, category: d.category, fileData: d.file_data, mimeType: d.mime_type, uploadedAt: d.uploaded_at });
const toSettings    = (s: ApiSettings): Settings => ({ theme: (s.theme as Settings["theme"]) ?? "light", push: s.push, email: s.email, sound: s.sound, units: (s.units as Settings["units"]) ?? "metric", currency: s.currency ?? "USD", language: s.language ?? "English" });
const toAlertRecord = (r: ApiAlertRecord): Alert => ({
  id: r.alert_key,
  emoji: r.emoji,
  title: r.title,
  body: r.body,
  when: r.when_display,
  group: r.group_name as "Today" | "Upcoming",
  color: r.color,
  sortTime: r.sort_time ?? 0,
  status: r.status as "completed" | "missed" | "upcoming" | undefined,
});

/* Fire a browser notification + save DB milestone when hitting 100 / 1000 days */
async function checkStreakMilestone(streak: number, pets: Pet[]) {
  if (typeof window === "undefined") return;
  const MILESTONES = [1000, 100]; // highest first
  const notified = parseInt(localStorage.getItem("pawzo:streak-milestone") ?? "0", 10);

  for (const ms of MILESTONES) {
    if (streak >= ms && notified < ms) {
      localStorage.setItem("pawzo:streak-milestone", String(ms));

      // Browser notification
      try {
        if (Notification.permission === "default") await Notification.requestPermission();
        if (Notification.permission === "granted") {
          const reg = "serviceWorker" in navigator
            ? await navigator.serviceWorker.getRegistration().catch(() => undefined)
            : undefined;
          const title  = ms === 1000 ? "🏆 1000-Day Streak Legend!" : "🔥 100-Day Streak!";
          const body   = ms === 1000
            ? "You've cared for your pet every single day for 1000 days. You are an absolute legend! 👑🐾"
            : "100 days of non-stop pet care! You're on fire and your pet is so lucky! 🔥";
          if (reg && "showNotification" in reg) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (reg as any).showNotification(title, { body, icon: "/favicon.ico", requireInteraction: true });
          } else {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        }
      } catch { /* ignore */ }

      // Add milestone record to first pet
      if (pets.length > 0) {
        milestonesApi.create(pets[0].id, {
          emoji: ms === 1000 ? "🏆" : "🔥",
          title: ms === 1000 ? "1000-Day Streak Legend!" : "100-Day Streak!",
          date: new Date().toISOString().slice(0, 10),
        }).catch(() => {});
      }
      break; // notify only the highest milestone reached
    }
  }
}

/* Load all data for the current user from the API */
async function loadAll(userId: string): Promise<Partial<State>> {
  const pets = (await petsApi.list()).map(toPet);
  const ids  = pets.map((p) => p.id);

  const [meals, mealLogs, vaccinations, weights, health, expenses, milestones, memories, events, environment, vet, docs, settings, activityRes, meRes, pastAlerts] =
    await Promise.all([
      Promise.all(ids.map((id) => mealsApi.list(id))).then((r) => r.flat().map(toMeal)).catch(() => [] as Meal[]),
      Promise.all(ids.map((id) => mealLogsApi.list(id))).then((r) => r.flat().map(toMealLog)).catch(() => [] as MealLog[]),
      Promise.all(ids.map((id) => vaccinationsApi.list(id))).then((r) => r.flat().map(toVaccination)).catch(() => [] as Vaccination[]),
      Promise.all(ids.map((id) => weightsApi.list(id))).then((r) => r.flat().map(toWeight)).catch(() => [] as WeightEntry[]),
      Promise.all(ids.map((id) => healthApi.list(id))).then((r) => r.flat().map(toHealth)).catch(() => [] as HealthRecord[]),
      Promise.all(ids.map((id) => expensesApi.list(id))).then((r) => r.flat().map(toExpense)).catch(() => [] as Expense[]),
      Promise.all(ids.map((id) => milestonesApi.list(id))).then((r) => r.flat().map(toMilestone)).catch(() => [] as Milestone[]),
      Promise.all(ids.map((id) => memoriesApi.list(id))).then((r) => r.flat().map(toMemory)).catch(() => [] as Memory[]),
      Promise.all(ids.map((id) => calendarApi.list(id))).then((r) => r.flat().map(toEvent)).catch(() => [] as CalendarEvent[]),
      Promise.all(ids.map((id) => environmentApi.list(id))).then((r) => r.flat().map(toEnvTask)).catch(() => [] as EnvTask[]),
      userApi.getVet().then(toVet).catch(() => null as Vet),
      documentsApi.list().then((r) => r.map(toDocument)).catch(() => [] as Document[]),
      userApi.getSettings().then(toSettings).catch(() => EMPTY.settings),
      userApi.recordActivity().catch(() => ({ dates: [] as string[], streak: 0, streak_broken: false })),
      userApi.getMe().catch(() => null),
      alertsApi.list().then((r) => r.map(toAlertRecord)).catch(() => [] as Alert[]),
    ]);

  return {
    currentUserId: userId,
    currentUserPhoto: meRes?.photo_url ?? "",
    pets,
    meals, mealLogs, vaccinations, weights, health,
    expenses, milestones, memories, events, environment,
    vet, documents: docs, settings,
    activity: activityRes.dates,
    streakCount: activityRes.streak,
    streakBroken: activityRes.streak_broken,
    selectedPetId: pets[0]?.id ?? null,
    pastAlerts,
  };
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
type Ctx = {
  ready: boolean;
  state: State;
  register:      (a: { name: string; username: string; email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  login:         (idOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout:           () => void;
  requestDeletion:  () => Promise<void>;
  resetPassword:    (email: string, newPassword: string) => { ok: boolean; error?: string };
  sendVerification: () => Promise<{ ok: boolean; error?: string; message?: string }>;
  verifyEmail:      (code: string) => Promise<{ ok: boolean; error?: string }>;
  currentUser:      () => { id: string; name: string; username: string; email: string; photo: string } | null;
  updateUserPhoto:  (photoUrl: string) => Promise<void>;
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
  addDocument:    (d: Omit<Document, "id">) => Promise<void>;
  removeDocument: (id: string) => void;
  renameDocument: (id: string, name: string) => void;
  setVet:        (v: Vet) => void;
  setSettings:   (patch: Partial<Settings>) => void;
  recordActivity: () => void;
  streak:        () => number;
  streakBroken:  () => boolean;
};

const PawzoCtx = createContext<Ctx | null>(null);

export function PawzoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<State>(EMPTY);
  const savedAlertKeysRef = useRef<Set<string>>(new Set());

  const mutate = (fn: (s: State) => State) =>
    setState((s) => { const next = fn({ ...s }); stateRef.current = next; return next; });

  /* Apply theme */
  useEffect(() => {
    if (!ready) return;
    const t = state.settings.theme;
    const dark = t === "dark" || (t === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [state.settings.theme, ready]);

  /* Push-notify new alerts (fires whenever state changes; deduped by daily localStorage key) */
  useEffect(() => {
    if (!ready || !state.settings.push || typeof window === "undefined") return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const NOTIFIED_KEY = `pawzo:push-notified-${todayKey}`;
    let notified: Set<string>;
    try { notified = new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "[]") as string[]); }
    catch { notified = new Set(); }

    const newAlerts = deriveAlerts(state).filter((a) => !notified.has(a.id));
    if (newAlerts.length === 0) return;

    (async () => {
      try {
        if (Notification.permission === "default") await Notification.requestPermission();
        if (Notification.permission !== "granted") return;
        const reg = "serviceWorker" in navigator
          ? await navigator.serviceWorker.getRegistration().catch(() => undefined)
          : undefined;
        for (const a of newAlerts) {
          if (reg && "showNotification" in reg) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (reg as any).showNotification(a.title, { body: a.body, icon: "/favicon.ico" });
          } else {
            new Notification(a.title, { body: a.body, icon: "/favicon.ico" });
          }
        }
      } catch { /* notification API unavailable */ }
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, ...newAlerts.map((a) => a.id)]));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready]);

  /* Persist new alerts to DB with 7-day TTL */
  useEffect(() => {
    if (!ready) return;
    const derived = deriveAlerts(state);
    const newAlerts = derived.filter(a => !savedAlertKeysRef.current.has(a.id));
    if (!newAlerts.length) return;
    newAlerts.forEach(a => savedAlertKeysRef.current.add(a.id));
    const nowMs = Date.now();
    const toUpsert: ApiAlertRecordIn[] = newAlerts.map(a => ({
      alert_key: a.id,
      pet_id: null,
      emoji: a.emoji,
      title: a.title,
      body: a.body,
      when_display: a.when,
      when_ms: a.sortTime || null,
      group_name: a.group,
      color: a.color,
      sort_time: a.sortTime || null,
      status: a.status || "upcoming",
      created_at: nowMs,
      expires_at: nowMs + 7 * 24 * 60 * 60 * 1000,
    }));
    alertsApi.upsertBatch(toUpsert).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready]);

  /* Bootstrap: load from API if token exists */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("pawzo:token") : null;
    if (!token) { setReady(true); return; }

    authApi.me()
      .then((user) => loadAll(user.id).then((data) => {
        mutate((s) => ({ ...s, ...data, currentUserName: user.name, currentUserUsername: user.username, currentUserEmail: user.email, emailVerified: user.email_verified ?? false }));
        // Seed savedAlertKeysRef with already-persisted alert IDs so we don't re-upsert them
        if (data.pastAlerts) {
          data.pastAlerts.forEach(a => savedAlertKeysRef.current.add(a.id));
        }
        setReady(true);
        checkStreakMilestone(data.streakCount ?? 0, data.pets ?? []);
      }))
      .catch((err: unknown) => {
        // Only clear token on 401 (invalid/expired). Network errors (Render cold
        // start, offline) should keep the token so the user stays logged in.
        const status = (err as { status?: number })?.status;
        if (status === 401) localStorage.removeItem("pawzo:token");
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
        mutate((s) => ({ ...s, ...data, currentUserName: res.user.name, currentUserUsername: res.user.username, currentUserEmail: res.user.email, emailVerified: res.user.email_verified ?? false }));
        authApi.sendVerification().catch(() => {});
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
        mutate((s) => ({ ...s, ...data, currentUserName: res.user.name, currentUserUsername: res.user.username, currentUserEmail: res.user.email, emailVerified: res.user.email_verified ?? false }));
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message };
      }
    },

    logout: () => {
      localStorage.removeItem("pawzo:token");
      mutate(() => ({ ...EMPTY }));
    },

    requestDeletion: async () => {
      await userApi.requestDeletion();
    },

    resetPassword: () => ({ ok: false, error: "Password reset via email — coming soon." }),

    sendVerification: async () => {
      try {
        const res = await authApi.sendVerification();
        return { ok: true, message: res.message };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message };
      }
    },

    verifyEmail: async (code) => {
      try {
        const user = await authApi.verifyEmail(code);
        mutate((s) => ({ ...s, emailVerified: user.email_verified ?? false }));
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message };
      }
    },

    currentUser: () => {
      const s = stateRef.current;
      if (!s.currentUserId) return null;
      return { id: s.currentUserId, name: s.currentUserName, username: s.currentUserUsername, email: s.currentUserEmail, photo: s.currentUserPhoto };
    },

    updateUserPhoto: async (photoUrl: string) => {
      mutate((s) => ({ ...s, currentUserPhoto: photoUrl }));
      await userApi.updatePhoto(photoUrl).catch(console.error);
    },

    /* ── Pets ──────────────────────────────────────────────────────────── */
    addPet: async (p) => {
      const res = await petsApi.create({
        name: p.name, species: p.species, breed: p.breed, gender: p.gender,
        dob: p.dob, weight: p.weight, photo_url: p.photo, region: p.region, notes: p.notes,
      });
      const pet = toPet(res);
      mutate((s) => ({ ...s, pets: [...s.pets, pet], selectedPetId: pet.id }));

      // Smart auto-create: seed recommended environment tasks for the species.
      const defaults = ENV_DEFAULTS[pet.species] ?? [];
      if (defaults.length) {
        const today = todayISO();
        Promise.all(defaults.map((d) =>
          environmentApi.create(pet.id, {
            name: d.name, frequency: freqLabel(d.intervalDays), interval_days: d.intervalDays,
            last_completed: "", next_due: addDays(today, d.intervalDays),
          })
        )).then((created) => {
          mutate((s) => ({ ...s, environment: [...s.environment, ...created.map(toEnvTask)] }));
        }).catch(console.error);
      }
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
        environment: s.environment.filter((x) => x.petId !== id),
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
      const { petId, ...rest } = item as unknown as { petId: string } & Record<string, unknown>;
      const [apiRes, id] = await callCreate(coll, petId, rest);
      const converted = convertFromApi(coll, petId, apiRes);
      mutate((s) => ({
        ...s,
        [coll]: [...(s[coll] as unknown[]), converted],
      }));
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
      const existing = stateRef.current.mealLogs.find((l) => l.petId === petId && l.mealId === mealId && l.date === date);
      const becomingDone = !existing || !existing.done;
      const fedMs = Date.now();
      const fedAtKey = `pawzo:meal-fed-at-${petId}-${mealId}-${date}`;
      if (typeof window !== "undefined") {
        if (becomingDone) {
          localStorage.setItem(fedAtKey, String(fedMs));
          // Log to activity history
          const meal = stateRef.current.meals.find((m) => m.id === mealId);
          const pet  = stateRef.current.pets.find((p) => p.id === petId);
          if (meal && pet) {
            const now2 = new Date(fedMs);
            const hhmm = `${String(now2.getHours()).padStart(2, "0")}:${String(now2.getMinutes()).padStart(2, "0")}`;
            const wasLate = !!(meal.time && meal.time <= hhmm);
            appendActivity({
              icon: "✅",
              title: wasLate ? `${meal.name} fed` : `${pet.name} has been fed!`,
              body: wasLate
                ? `${pet.name}'s ${meal.name} was given. Better late than never! 🐾`
                : `${pet.name} enjoyed their ${meal.name}!`,
              timestamp: fedMs,
              status: "completed",
            });
          }
        } else {
          localStorage.removeItem(fedAtKey);
        }
      }
      mutate((s) => {
        const ex = s.mealLogs.find((l) => l.petId === petId && l.mealId === mealId && l.date === date);
        const mealLogs = ex
          ? s.mealLogs.map((l) => l.id === ex.id ? { ...l, done: !l.done, fedAt: becomingDone ? fedMs : undefined } : l)
          : [...s.mealLogs, { id: `tmp-${Date.now()}`, petId, mealId, date, done: true, fedAt: fedMs }];
        return { ...s, mealLogs };
      });
      mealLogsApi.toggle(petId, mealId, date, becomingDone ? fedMs : undefined)
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

    /* ── Documents ──────────────────────────────────────────────────────── */
    addDocument: async (d) => {
      const res = await documentsApi.create({ name: d.name, category: d.category, file_data: d.fileData, mime_type: d.mimeType, uploaded_at: d.uploadedAt });
      const doc = toDocument(res);
      mutate((s) => ({ ...s, documents: [doc, ...s.documents] }));
    },

    removeDocument: (id) => {
      mutate((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== id) }));
      documentsApi.delete(id).catch(console.error);
    },

    renameDocument: (id, name) => {
      mutate((s) => ({ ...s, documents: s.documents.map((d) => d.id === id ? { ...d, name } : d) }));
      documentsApi.rename(id, name).catch(console.error);
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

    recordActivity: () => {},

    streak:       () => stateRef.current.streakCount,
    streakBroken: () => stateRef.current.streakBroken,
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

const COLL_ROUTE: Record<CollKey, string> = {
  meals: "meals", mealLogs: "meal-logs", vaccinations: "vaccinations",
  weights: "weights", health: "health", expenses: "expenses",
  milestones: "milestones", memories: "memories", events: "events",
  environment: "environment",
};

/* Convert frontend item fields → API body (snake_case) */
function toApiBody(coll: CollKey, item: Record<string, unknown>): Record<string, unknown> {
  const body = { ...item };
  delete body.petId;
  if (coll === "vaccinations" && "nextDue" in body) { body.next_due = body.nextDue; delete body.nextDue; }
  if (coll === "expenses"     && "receipt" in body) { body.receipt_url = body.receipt; delete body.receipt; }
  if (coll === "memories") {
    if ("photo"      in body) { body.photo_url  = body.photo;     delete body.photo; }
    if ("timeTaken"  in body) { body.time_taken = body.timeTaken; delete body.timeTaken; }
    if ("mediaType"  in body) { body.media_type = body.mediaType; delete body.mediaType; }
  }
  if (coll === "mealLogs"     && "mealId"  in body) { body.meal_id     = body.mealId;  delete body.mealId; }
  if (coll === "events"       && "allDay"  in body) { body.all_day     = body.allDay;  delete body.allDay; }
  if (coll === "environment") {
    if ("intervalDays"  in body) { body.interval_days  = body.intervalDays;  delete body.intervalDays; }
    if ("lastCompleted" in body) { body.last_completed = body.lastCompleted; delete body.lastCompleted; }
    if ("nextDue"       in body) { body.next_due       = body.nextDue;       delete body.nextDue; }
  }
  return body;
}

/* Convert API response → frontend type */
function convertFromApi(coll: CollKey, petId: string, res: Record<string, unknown>): unknown {
  const base: Record<string, unknown> = { ...res, petId: res.pet_id ?? petId };
  delete (base as Record<string, unknown>).pet_id;
  if (coll === "vaccinations") { base.nextDue = res.next_due ?? ""; delete (base as Record<string, unknown>).next_due; }
  if (coll === "expenses")     { base.receipt = res.receipt_url ?? ""; delete (base as Record<string, unknown>).receipt_url; }
  if (coll === "memories") {
    base.photo     = res.photo_url  ?? "";    delete (base as Record<string, unknown>).photo_url;
    base.timeTaken = res.time_taken ?? "";    delete (base as Record<string, unknown>).time_taken;
    base.mediaType = res.media_type ?? "photo"; delete (base as Record<string, unknown>).media_type;
    if (!("title" in base))     base.title     = "";
    if (!("mood"  in base))     base.mood      = "";
    if (!("tags"  in base))     base.tags      = "";
  }
  if (coll === "events")       { base.allDay   = res.all_day  ?? false; delete (base as Record<string, unknown>).all_day; }
  if (coll === "mealLogs")     { base.mealId  = res.meal_id ?? "";     delete (base as Record<string, unknown>).meal_id; }
  if (coll === "environment") {
    base.intervalDays  = res.interval_days  ?? 7;   delete (base as Record<string, unknown>).interval_days;
    base.lastCompleted = res.last_completed ?? "";  delete (base as Record<string, unknown>).last_completed;
    base.nextDue       = res.next_due       ?? "";  delete (base as Record<string, unknown>).next_due;
  }
  return base;
}

async function callCreate(coll: CollKey, petId: string, body: Record<string, unknown>): Promise<[Record<string, unknown>, string]> {
  const route = COLL_ROUTE[coll];
  const apiBody = toApiBody(coll, { ...body, petId });
  let res: unknown;
  switch (coll) {
    case "meals":         res = await mealsApi.create(petId, apiBody as never);         break;
    case "vaccinations":  res = await vaccinationsApi.create(petId, apiBody as never);  break;
    case "weights":       res = await weightsApi.create(petId, apiBody as never);       break;
    case "health":        res = await healthApi.create(petId, apiBody as never);        break;
    case "expenses":      res = await expensesApi.create(petId, apiBody as never);      break;
    case "milestones":    res = await milestonesApi.create(petId, apiBody as never);    break;
    case "memories":      res = await memoriesApi.create(petId, apiBody as never);      break;
    case "events":        res = await calendarApi.create(petId, apiBody as never);      break;
    case "environment":   res = await environmentApi.create(petId, apiBody as never);   break;
    default:
      throw new Error(`No create route for ${route}`);
  }
  return [res as Record<string, unknown>, (res as { id: string }).id];
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
    case "environment":   await environmentApi.update(petId, id, apiPatch as never);   break;
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
    case "environment":   await environmentApi.delete(petId, id);   break;
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

/* ─── Environment task helpers ────────────────────────────────────────────── */
/* Format a Date using its LOCAL calendar fields (toISOString would shift to UTC
   and drop a day for timezones ahead of UTC, e.g. IST). */
function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date((iso || todayISO()) + "T00:00:00"); // parse as local midnight
  if (isNaN(d.getTime())) { const t = new Date(); t.setDate(t.getDate() + n); return localISO(t); }
  d.setDate(d.getDate() + n);
  return localISO(d);
}

/* Human-friendly frequency label from an interval in days. */
export function freqLabel(days: number): string {
  if (days === 1)  return "Daily";
  if (days === 7)  return "Weekly";
  if (days === 30) return "Monthly";
  if (days === 365) return "Yearly";
  if (days > 30 && days % 30 === 0) return `Every ${days / 30} Months`;
  return `Every ${days} Days`;
}

/* Next-due = last completed (or today) + interval. */
export function computeNextDue(lastCompleted: string, intervalDays: number): string {
  return addDays(lastCompleted || todayISO(), intervalDays);
}

export type EnvStatus = "completed" | "upcoming" | "due" | "overdue";
export function envTaskStatus(t: EnvTask): EnvStatus {
  if (t.lastCompleted && t.lastCompleted === todayISO()) return "completed";
  const d = daysUntil(t.nextDue);
  if (d < 0)  return "overdue";
  if (d <= 2) return "due";
  return "upcoming";
}

/* Species-specific task catalogue (full list shown as quick-add suggestions). */
export const ENV_TASK_TEMPLATES: Record<string, { name: string; intervalDays: number }[]> = {
  Dog:          [{ name: "Bed Cleaning", intervalDays: 7 }, { name: "Toy Cleaning", intervalDays: 10 }, { name: "Outdoor Area Maintenance", intervalDays: 7 }, { name: "Grooming Area Maintenance", intervalDays: 30 }],
  Cat:          [{ name: "Litter Box Cleaning", intervalDays: 1 }, { name: "Litter Replacement", intervalDays: 7 }, { name: "Bed Cleaning", intervalDays: 7 }, { name: "Scratching Post Maintenance", intervalDays: 30 }],
  Fish:         [{ name: "Tank Cleaning", intervalDays: 14 }, { name: "Water Change", intervalDays: 7 }, { name: "Filter Cleaning", intervalDays: 30 }, { name: "Water Temperature Monitoring", intervalDays: 1 }],
  Hamster:      [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }, { name: "Water Bottle Cleaning", intervalDays: 3 }, { name: "Wheel & Toy Maintenance", intervalDays: 7 }],
  Tortoise:     [{ name: "Enclosure Cleaning", intervalDays: 7 }, { name: "UV Lamp Replacement", intervalDays: 180 }, { name: "Basking Area Check", intervalDays: 1 }, { name: "Substrate Replacement", intervalDays: 30 }],
  Reptile:      [{ name: "Habitat Cleaning", intervalDays: 7 }, { name: "Humidity Monitoring", intervalDays: 1 }, { name: "Temperature Monitoring", intervalDays: 1 }, { name: "UVB Bulb Replacement", intervalDays: 180 }],
  Bird:         [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Perch Cleaning", intervalDays: 7 }, { name: "Water Replacement", intervalDays: 1 }, { name: "Toy Rotation", intervalDays: 14 }],
  Rabbit:       [{ name: "Hutch Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }, { name: "Litter Box Cleaning", intervalDays: 3 }, { name: "Hay Storage Monitoring", intervalDays: 7 }],
  "Guinea pig": [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }, { name: "Water Bottle Cleaning", intervalDays: 3 }, { name: "Hay Storage Monitoring", intervalDays: 7 }],
  Other:        [{ name: "Habitat Cleaning", intervalDays: 7 }, { name: "Bedding / Litter Replacement", intervalDays: 7 }, { name: "Water Replacement", intervalDays: 1 }],
};

/* Subset auto-created the moment a pet is added (user can edit/remove later). */
export const ENV_DEFAULTS: Record<string, { name: string; intervalDays: number }[]> = {
  Dog:          [{ name: "Bed Cleaning", intervalDays: 7 }, { name: "Toy Cleaning", intervalDays: 10 }],
  Cat:          [{ name: "Litter Box Cleaning", intervalDays: 1 }, { name: "Litter Replacement", intervalDays: 7 }],
  Fish:         [{ name: "Tank Cleaning", intervalDays: 14 }, { name: "Water Change", intervalDays: 7 }, { name: "Filter Cleaning", intervalDays: 30 }],
  Hamster:      [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }],
  Tortoise:     [{ name: "Enclosure Cleaning", intervalDays: 7 }, { name: "UV Lamp Replacement", intervalDays: 180 }],
  Reptile:      [{ name: "Habitat Cleaning", intervalDays: 7 }, { name: "UVB Bulb Replacement", intervalDays: 180 }],
  Bird:         [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Water Replacement", intervalDays: 1 }],
  Rabbit:       [{ name: "Hutch Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }],
  "Guinea pig": [{ name: "Cage Cleaning", intervalDays: 7 }, { name: "Bedding Replacement", intervalDays: 5 }],
};

export type Alert = { id: string; emoji: string; title: string; body: string; when: string; group: "Today" | "Upcoming"; color: string; sortTime: number; status?: "completed" | "missed" | "upcoming"; petId?: string; route?: string };

export function deriveAlerts(state: State): Alert[] {
  const out: Alert[] = [];
  const today = todayISO();
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const hhmmToMs = (hhmm: string) => { const [h, mn] = hhmm.split(":").map(Number); const d = new Date(); d.setHours(h, mn, 0, 0); return d.getTime(); };
  const dateToMs = (iso: string, time?: string) => new Date(iso + (time ? "T" + time : "T00:00")).getTime();

  // Read event + med done states from localStorage (same keys used by dashboard)
  const doneScheduleKeys = (() => {
    if (typeof window === "undefined") return new Set<string>();
    try { return new Set<string>(JSON.parse(localStorage.getItem(`pawzo:schedule-done-${today}`) ?? "[]")); }
    catch { return new Set<string>(); }
  })();
  const doneMedKeys = (() => {
    if (typeof window === "undefined") return new Set<string>();
    try { return new Set<string>(JSON.parse(localStorage.getItem(`pawzo:med-done-${today}`) ?? "[]")); }
    catch { return new Set<string>(); }
  })();

  // Load alert stamps early so seenAt() can be used while building alerts
  const STAMP_KEY = "pawzo:alert-stamps";
  let stamps: Record<string, number> = {};
  if (typeof window !== "undefined") {
    try { stamps = JSON.parse(localStorage.getItem(STAMP_KEY) ?? "{}"); } catch { stamps = {}; }
  }
  // Returns stored full datetime for an alert, or now if not yet stamped
  const seenAt = (id: string): string => fmtDateTime(stamps[id] ?? now.getTime());

  // Deterministic pick — varies by day + hour so phrases rotate throughout the day
  const pick = <T,>(arr: T[], seed: string) => arr[(seed + today + hourSlot).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % arr.length];

  const hourSlot = String(now.getHours()); // changes every hour for sub-daily variety
  const MEAL_FED_EMOJI   = ["😋", "🥰", "🎉", "🐾", "🥳", "😸", "🎊", "🍽️", "🌟", "💛"];
  const MEAL_FED_COLOR   = ["#FEF9C3", "#FCE7F3", "#D1FAE5", "#FFF0F5", "#E0F2FE"];
  const MEAL_FED_BODY    = [
    (p: string, m: string) => `${p} is doing a happy dance after their ${m}! Full and loved. 💛`,
    (p: string, m: string) => `${m} served! ${p} gives you two paws up. Stellar pet parent right here!`,
    (p: string, m: string) => `${p} polished off every last bite of ${m}. Licked the bowl clean!`,
    (p: string, m: string) => `${p}'s belly is full of ${m} and pure happiness. You rock!`,
    (p: string, m: string) => `Clean plate club! ${p} absolutely demolished that ${m}.`,
    (p: string, m: string) => `${m} down the hatch! ${p} is one very satisfied pet right now.`,
    (p: string, m: string) => `Nom nom nom! ${p} says that ${m} hit different today. 😋`,
    (p: string, m: string) => `${p} approved the ${m} — no crumbs left behind. Success!`,
  ];

  const MEAL_HUNGRY_EMOJI = ["🍖", "😤", "🥺", "👀", "😾", "🫠", "🤤"];
  const MEAL_HUNGRY_BODY  = [
    (p: string, m: string) => `${p}'s stomach just filed an official complaint about the missing ${m}.`,
    (p: string, m: string) => `${p} is giving you the most dramatic hungry eyes right now. ${m} time!`,
    (p: string, m: string) => `${m} o'clock! ${p} is fully locked into "feed me" mode.`,
    (p: string, m: string) => `${p} has officially declared a hunger emergency. ${m} needed ASAP!`,
    (p: string, m: string) => `The ${m} isn't going to serve itself. ${p} is waiting…`,
    (p: string, m: string) => `${p} just stared at the bowl for 10 minutes straight. ${m} time!`,
  ];

  const MEAL_SKIP_EMOJI      = ["😿", "🙀", "💔", "😢", "😭", "🫤"];
  const MEAL_SKIP_COLOR      = ["#FEE2E2", "#FFF1F2", "#FFEDD5"];
  const MEAL_LATE_FED_EMOJI  = ["🥲", "😅", "🎉", "🙈", "🥹", "😌", "🐾", "🌅", "☕", "🌙"];
  const MEAL_LATE_FED_BODY   = [
    (p: string, m: string) => `Late is better than never! ${p}'s ${m} is finally sorted. 🐾`,
    (p: string, m: string) => `${p} waited patiently and the ${m} finally arrived. Hero move!`,
    (p: string, m: string) => `Fashionably late ${m} for ${p}! They forgive you — this time. 😅`,
    (p: string, m: string) => `${p} gave you the side-eye but ate every bite of that ${m} anyway.`,
    (p: string, m: string) => `The ${m} arrived late but ${p} demolished it in seconds. Worth the wait!`,
    (p: string, m: string) => `Better a delayed ${m} than a skipped one! ${p} is a happy camper now.`,
    (p: string, m: string) => `${p} has officially forgiven you. The ${m} was worth the suspense!`,
    (p: string, m: string) => `Late night ${m} hits different! ${p} loved every bite.`,
  ];

  const MED_DONE_EMOJI   = ["🌟", "💫", "🏆", "🎊", "💪", "🌸", "⭐"];
  const MED_DONE_COLOR   = ["#EDE9FE", "#D1FAE5", "#E0F2FE", "#FFF0F5", "#FEF9C3"];
  const MED_PEND_EMOJI   = ["🔔", "⏰", "🩺", "🐾", "📋"];
  const MED_PEND_COLOR   = ["#EFF6FF", "#F5F3FF", "#FFF7ED", "#F0FDF4"];

  const EVT_DONE_EMOJI   = ["🎉", "🥳", "🏆", "⭐", "🎊", "🌟", "🎯"];
  const EVT_DONE_COLOR   = ["#FDF2F8", "#EDE9FE", "#FFFBEB", "#D1FAE5", "#FCE7F3"];
  const EVT_MISS_EMOJI   = ["😬", "😰", "🙈", "😅", "🕐"];
  const EVT_MISS_COLOR   = ["#FFEDD5", "#FFF1F2", "#FEE2E2"];
  const EVT_TODAY_EMOJI  = ["🎯", "🔥", "⚡", "📌", "🚀"];
  const EVT_SOON_COLOR   = ["#EDE9FE", "#EFF6FF", "#FDF2F8", "#FFF7ED"];

  const VAC_OVER_EMOJI   = ["🚨", "😱", "😨", "🏥"];
  const VAC_SOON_EMOJI   = ["🩺", "🏥", "📋", "🗓️"];
  const VAC_COLOR        = ["#DBEAFE", "#E0F2FE", "#EFF6FF"];

  const ENV_OVER_EMOJI   = ["🧹", "🪣", "🚨", "🧽"];
  const ENV_OVER_COLOR   = ["#FEE2E2", "#FFF1F2", "#FFEDD5"];
  const ENV_SOON_EMOJI   = ["🏡", "🧼", "🪴", "✨", "🧹"];
  const ENV_SOON_COLOR   = ["#F0FDFA", "#ECFEFF", "#EFF6FF", "#FEF9C3"];

  /* ── Streak milestones ───────────────────────────────────────────────── */
  if (state.streakCount === 100 || state.streakCount === 1000) {
    const ms = state.streakCount;
    out.push({
      id: `streak-milestone-${ms}`,
      emoji: ms === 1000 ? "🏆" : "🔥",
      title: ms === 1000 ? "1000-Day Streak Legend! 👑" : "100-Day Streak! 🔥",
      body: ms === 1000
        ? "You've cared for your pet every single day for 1000 days. You are an absolute legend and your pets are the luckiest in the world! 🐾✨"
        : "100 consecutive days of pet care! You're on fire and your pet notices every single day. Keep the streak alive! 💪",
      when: fmtDateTime(now.getTime()),
      group: "Today" as const,
      color: ms === 1000 ? "#FEF3C7" : "#FFF0F5",
      sortTime: now.getTime(),
      status: "completed" as const,
    });
  }

  for (const pet of state.pets) {
    const foodRoute = `/pet-profile/food?petId=${pet.id}`;
    const healthRoute = `/pet-profile/health?petId=${pet.id}`;
    const envRoute = `/pet-profile/environment?petId=${pet.id}`;
    const calendarRoute = `/calendar`;

    /* ── Meals ─────────────────────────────────────────────────────── */
    for (const m of state.meals.filter((ml) => ml.petId === pet.id)) {
      const seed = m.id + pet.id;
      const log = state.mealLogs.find((l) => l.petId === pet.id && l.mealId === m.id && l.date === today);
      const mealTimePassed = !!(m.time && m.time <= currentTime);
      if (mealTimePassed) {
        const minsLate = Math.round((now.getTime() - hhmmToMs(m.time)) / 60000);
        const isSkipped = minsLate > 10;
        out.push({ id: `meal-${m.id}`, emoji: isSkipped ? pick(MEAL_SKIP_EMOJI, seed) : pick(MEAL_HUNGRY_EMOJI, seed), title: isSkipped ? `${m.name} skipped — ${pet.name}` : `${pet.name} is hungry!`, body: isSkipped ? `${pet.name}'s ${m.name} was missed! Please feed them as soon as possible.` : pick(MEAL_HUNGRY_BODY, seed)(pet.name, m.name), when: fmtDateTime(hhmmToMs(m.time)), group: "Today", color: isSkipped ? pick(MEAL_SKIP_COLOR, seed) : "#FEF3C7", sortTime: hhmmToMs(m.time), status: isSkipped ? "missed" as const : "upcoming" as const, petId: pet.id, route: foodRoute });
      }
      if (log?.done) {
        const fedAtMs = log.fedAt
          || (typeof window !== "undefined"
              ? (parseInt(localStorage.getItem(`pawzo:meal-fed-at-${pet.id}-${m.id}-${today}`) ?? "0", 10) || 0)
              : 0)
          || (m.time ? hhmmToMs(m.time) : now.getTime());
        out.push({ id: `meal-done-${m.id}-${today}`, emoji: mealTimePassed ? pick(MEAL_LATE_FED_EMOJI, seed) : pick(MEAL_FED_EMOJI, seed), title: mealTimePassed ? `${m.name} fed` : `${pet.name} has been fed!`, body: mealTimePassed ? pick(MEAL_LATE_FED_BODY, seed)(pet.name, m.name) : pick(MEAL_FED_BODY, seed)(pet.name, m.name), when: fmtDateTime(fedAtMs), group: "Today", color: pick(MEAL_FED_COLOR, seed), sortTime: fedAtMs, status: "completed" as const, petId: pet.id, route: foodRoute });
      }
    }

    /* ── Medications ───────────────────────────────────────────────── */
    for (const med of state.health.filter((h) => h.kind === "medication" && h.active && h.petId === pet.id)) {
      const seed = med.id + pet.id;
      const given = doneMedKeys.has(`med-${med.id}`);
      if (given) {
        { const medDoneId = `med-done-${med.id}-${today}`; out.push({ id: medDoneId, emoji: pick(MED_DONE_EMOJI, seed), title: `${med.title} given`, body: `Great job! ${pet.name} got their ${med.title} today. Stay consistent!`, when: seenAt(medDoneId), group: "Today", color: pick(MED_DONE_COLOR, seed), sortTime: stamps[medDoneId] ?? now.getTime(), status: "completed" as const, petId: pet.id, route: healthRoute }); }
      } else {
        const hour = now.getHours();
        const slot = hour >= 21 ? "Last chance tonight! 🌙" : hour >= 18 ? "Evening reminder 🌆" : hour >= 12 ? "Afternoon nudge 🌤️" : "Morning reminder ☀️";
        out.push({ id: `med-${med.id}`, emoji: pick(MED_PEND_EMOJI, seed), title: `${pet.name}'s ${med.title}`, body: `${slot} — ${pet.name}'s medication hasn't been given today. Tap to log it!`, when: fmtDateTime(now.getTime()), group: "Today", color: pick(MED_PEND_COLOR, seed), sortTime: now.getTime() - 100, status: "upcoming" as const, petId: pet.id, route: healthRoute });
      }
    }

    /* ── Events ────────────────────────────────────────────────────── */
    for (const e of state.events.filter((ev) => ev.petId === pet.id)) {
      const seed = e.id + pet.id;
      const days = daysUntil(e.date);
      const isDone = doneScheduleKeys.has(`event-${e.id}`);
      const evtEmoji = e.emoji || pick(EVT_TODAY_EMOJI, seed);

      // Completed today (all-day events can have date in past)
      if (isDone && (days <= 0) && (e.allDay || days >= -1)) {
        const doneId = `evt-done-${e.id}-${today}`;
        out.push({ id: doneId, emoji: pick(EVT_DONE_EMOJI, seed), title: `${e.title} completed`, body: `${e.title} for ${pet.name} is all wrapped up. You're on a roll!`, when: seenAt(doneId), group: "Today", color: pick(EVT_DONE_COLOR, seed), sortTime: stamps[doneId] ?? now.getTime(), status: "completed" as const, petId: pet.id, route: calendarRoute });
        continue;
      }

      // Past events not done → missed (skip all-day events — they recur daily)
      if (!isDone && !e.allDay && days < 0 && days >= -3) {
        out.push({ id: `evt-missed-${e.id}`, emoji: pick(EVT_MISS_EMOJI, seed), title: `Missed: ${e.title}`, body: `${e.title} for ${pet.name} was due ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago. Mark it done or reschedule.`, when: fmtDateTime(dateToMs(e.date, e.time)), group: "Today", color: pick(EVT_MISS_COLOR, seed), sortTime: dateToMs(e.date, e.time), status: "missed" as const, petId: pet.id, route: calendarRoute });
        continue;
      }

      // Today (or any past date for all-day events) — show daily reminder
      if (!isDone && (days === 0 || (e.allDay && days < 0))) {
        if (e.time) {
          const evtMs     = hhmmToMs(e.time);
          const minus10Ms = evtMs - 10 * 60 * 1000;
          const plus10Ms  = evtMs + 10 * 60 * 1000;
          const nowMs     = now.getTime();

          if (nowMs >= plus10Ms) {
            // 10+ mins past event time and not done → skipped
            out.push({ id: `evt-skipped-${e.id}`, emoji: pick(EVT_MISS_EMOJI, seed), title: `${pet.name} skipped: ${e.title}`, body: `${e.title} was scheduled at ${e.time} and wasn't marked done. Did ${pet.name} miss it?`, when: fmtDateTime(plus10Ms), group: "Today", color: pick(EVT_MISS_COLOR, seed), sortTime: plus10Ms, status: "missed" as const, petId: pet.id, route: calendarRoute });
          } else if (nowMs >= evtMs) {
            // Exact time window
            out.push({ id: `evt-now-${e.id}`, emoji: evtEmoji, title: `${e.title} — right now!`, body: `It's time for ${pet.name}'s ${e.title}! Don't keep them waiting 🐾`, when: fmtDateTime(evtMs), group: "Today", color: pick(EVT_SOON_COLOR, seed), sortTime: evtMs, status: "upcoming" as const, petId: pet.id, route: calendarRoute });
          } else if (nowMs >= minus10Ms) {
            // 10-minute countdown
            const minsLeft = Math.max(1, Math.round((evtMs - nowMs) / 60000));
            out.push({ id: `evt-soon-${e.id}`, emoji: "⏰", title: `${e.title} in ${minsLeft} min${minsLeft !== 1 ? "s" : ""}!`, body: `${pet.name}'s ${e.title} starts at ${e.time}. Get ready!`, when: fmtDateTime(minus10Ms), group: "Today", color: pick(EVT_SOON_COLOR, seed), sortTime: minus10Ms, status: "upcoming" as const, petId: pet.id, route: calendarRoute });
          } else if (now.getHours() >= 8) {
            // Morning reminder — shown from 8 AM until 10-min window opens
            const morningId = `evt-morning-${e.id}`;
            out.push({ id: morningId, emoji: evtEmoji, title: `Today: ${e.title}`, body: `${pet.name} has ${e.title} at ${e.time} today. Don't forget! 🗓️`, when: seenAt(morningId), group: "Today", color: pick(EVT_SOON_COLOR, seed), sortTime: stamps[morningId] ?? now.getTime(), status: "upcoming" as const, petId: pet.id, route: calendarRoute });
          }
        } else {
          // No time — all-day reminder visible from 8 AM
          if (now.getHours() >= 8) {
            const allDayId = `evt-${e.id}`;
            out.push({ id: allDayId, emoji: evtEmoji, title: e.title, body: `Today is the day for ${pet.name}'s ${e.title}! Tap to mark it done when finished. 🐾`, when: seenAt(allDayId), group: "Today", color: pick(EVT_SOON_COLOR, seed), sortTime: stamps[allDayId] ?? now.getTime(), status: "upcoming" as const, petId: pet.id, route: calendarRoute });
          }
        }
      }
      // days > 0 → no alert until the event day arrives
    }

    /* ── Vaccinations ──────────────────────────────────────────────── */
    for (const v of state.vaccinations.filter((v) => v.petId === pet.id && v.nextDue)) {
      const seed = v.id + pet.id;
      const days = daysUntil(v.nextDue);
      if (days <= 30) out.push({ id: `vac-${v.id}`, emoji: days < 0 ? pick(VAC_OVER_EMOJI, seed) : pick(VAC_SOON_EMOJI, seed), title: `${v.name} ${days < 0 ? "overdue" : "due soon"}`, body: days < 0 ? `${pet.name} is overdue for ${v.name}! Book the vet ASAP.` : `${pet.name} needs ${v.name} in ${days} day${days > 1 ? "s" : ""}.`, when: fmtDateTime(new Date(v.nextDue).getTime()), group: days <= 0 ? "Today" : "Upcoming", color: pick(VAC_COLOR, seed), sortTime: days < 0 ? new Date(v.nextDue).getTime() : now.getTime() - 1 - days * 1000, status: days < 0 ? "missed" as const : "upcoming" as const, petId: pet.id, route: healthRoute });
    }

    /* ── Environment / Habitat maintenance ─────────────────────────── */
    for (const t of state.environment.filter((e) => e.petId === pet.id && e.nextDue)) {
      if (t.lastCompleted === today) continue; // freshly done — don't nag
      const seed = t.id + pet.id;
      const days = daysUntil(t.nextDue);
      const lname = t.name.toLowerCase();
      const dueMs = new Date(t.nextDue + "T00:00:00").getTime();
      if (days < 0) {
        out.push({ id: `env-${t.id}`, emoji: pick(ENV_OVER_EMOJI, seed), title: `${t.name} overdue`, body: `${pet.name}'s ${lname} is overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""}. Time to freshen up their space! 🧹`, when: fmtDateTime(dueMs), group: "Today", color: pick(ENV_OVER_COLOR, seed), sortTime: dueMs, status: "missed" as const, petId: pet.id, route: envRoute });
      } else if (days <= 2) {
        out.push({ id: `env-${t.id}`, emoji: pick(ENV_SOON_EMOJI, seed), title: `${t.name} due ${days === 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days"}`, body: `${pet.name}'s ${lname} is coming up. Keep their habitat clean and comfy! 🏡`, when: fmtDateTime(dueMs), group: "Today", color: pick(ENV_SOON_COLOR, seed), sortTime: now.getTime() - 1 - days * 1000, status: "upcoming" as const, petId: pet.id, route: envRoute });
      } else if (days <= 7) {
        out.push({ id: `env-${t.id}`, emoji: pick(ENV_SOON_EMOJI, seed), title: `${t.name} due in ${days} days`, body: `${pet.name}'s ${lname} is due ${fmtDate(t.nextDue)}. Plan ahead! 🗓️`, when: `${fmtDate(t.nextDue)}, 12:00 AM`, group: "Upcoming", color: pick(ENV_SOON_COLOR, seed), sortTime: now.getTime() - 1 - days * 1000, status: "upcoming" as const, petId: pet.id, route: envRoute });
      }
    }

    /* ── Birthdays ─────────────────────────────────────────────────── */
    if (pet.dob) {
      const [by, bm, bd] = pet.dob.split("-").map(Number);
      const todayDate = new Date(today); todayDate.setHours(0, 0, 0, 0);
      const thisYear = todayDate.getFullYear();
      let bday = new Date(thisYear, bm - 1, bd);
      if (bday.getTime() < todayDate.getTime()) bday = new Date(thisYear + 1, bm - 1, bd);
      const bdayDays = Math.round((bday.getTime() - todayDate.getTime()) / 86_400_000);
      const age = bday.getFullYear() - by;
      const bdayIso = `${bday.getFullYear()}-${String(bm).padStart(2, "0")}-${String(bd).padStart(2, "0")}`;
      if (bdayDays === 0) {
        const bdayId = `bday-${pet.id}-${today}`;
        out.push({ id: bdayId, emoji: "🎂", title: `Happy Birthday, ${pet.name}! 🥳`, body: `${pet.name} turns ${age} today! Give them extra cuddles and maybe a birthday treat! 🎊`, when: seenAt(bdayId), group: "Today", color: "#FEF3C7", sortTime: stamps[bdayId] ?? now.getTime(), status: "upcoming" as const, petId: pet.id, route: calendarRoute });
      } else if (bdayDays <= 7) {
        const bdayUpcomingWhen = `${fmtDate(bdayIso)}, 12:00 AM`;
        out.push({ id: `bday-${pet.id}-upcoming`, emoji: "🎂", title: `${pet.name}'s birthday in ${bdayDays} day${bdayDays > 1 ? "s" : ""}!`, body: bdayDays === 1 ? `${pet.name} turns ${age} tomorrow! Get those birthday treats ready! 🐾` : `${pet.name} turns ${age} on ${fmtDate(bdayIso)}. Start planning something special! 🎉`, when: bdayUpcomingWhen, group: "Upcoming", color: "#FEF9C3", sortTime: now.getTime() - 1 - bdayDays * 1000, status: "upcoming" as const, petId: pet.id, route: calendarRoute });
      }
    }
  }

  /* Stamp each alert with the real wall-clock time it first appeared so
     the sort reflects when alerts actually arrived, not event dates. */
  if (typeof window !== "undefined") {
    const nowMs = now.getTime();
    let changed = false;
    for (const a of out) {
      if (stamps[a.id] === undefined) {
        stamps[a.id] = nowMs;
        changed = true;
        // First time this alert appears — log missed meals/events to activity history
        if (a.status === "missed") {
          appendActivity({ icon: a.emoji, title: a.title, body: a.body, timestamp: nowMs, status: "missed" });
        }
      }
    }
    if (changed) {
      try { localStorage.setItem(STAMP_KEY, JSON.stringify(stamps)); } catch { /* quota */ }
    }
  }

  return out;
}

export function daysUntil(iso: string): number {
  const d = new Date(iso), now = new Date();
  now.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

export type ActivityEntry = { id: string; icon: string; title: string; body: string; timestamp: number; status: "completed" | "missed" };
const ACTIVITY_KEY = "pawzo:activity-log";

export function appendActivity(entry: Omit<ActivityEntry, "id">): void {
  if (typeof window === "undefined") return;
  try {
    const log: ActivityEntry[] = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "[]");
    log.push({ ...entry, id: `act-${entry.timestamp}-${Math.random().toString(36).slice(2, 6)}` });
    if (log.length > 300) log.splice(0, log.length - 300);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  } catch { /* ignore */ }
}

export function getActivityLog(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "[]"); }
  catch { return []; }
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

/* ─── Alert read-state (persisted in localStorage) ───────────────────────── */
const ALERT_READ_KEY = "pawzo:alerts-read";

export function getReadAlertIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ALERT_READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

export function markAlertsRead(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getReadAlertIds();
    ids.forEach((id) => existing.add(id));
    localStorage.setItem(ALERT_READ_KEY, JSON.stringify([...existing].slice(-500)));
  } catch {}
}

/* ─── Currency helpers ────────────────────────────────────────────────────── */
export function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency", currency: code, currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export const CURRENCIES: { code: string; name: string }[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "KRW", name: "South Korean Won" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ZAR", name: "South African Rand" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "KHR", name: "Cambodian Riel" },
];

export const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu",
  "Arabic", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Russian", "Polish", "Ukrainian",
  "Turkish", "Japanese", "Korean", "Chinese (Simplified)",
  "Chinese (Traditional)", "Indonesian", "Malay", "Thai", "Vietnamese",
];
