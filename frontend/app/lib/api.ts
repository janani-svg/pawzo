/* Pawzo API client — all fetch calls go through here */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pawzo:token") ?? "";
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Request failed");
  return data as T;
}

const get  = <T>(path: string)                  => req<T>("GET",    path);
const post = <T>(path: string, body?: unknown)  => req<T>("POST",   path, body);
const put  = <T>(path: string, body?: unknown)  => req<T>("PUT",    path, body);
const del  =     (path: string)                 => req<void>("DELETE", path);

/* ── Auth ──────────────────────────────────────────────────────────────── */
export const authApi = {
  register: (data: { name: string; username: string; email: string; password: string }) =>
    post<{ access_token: string; token_type: string; user: ApiUser }>("/auth/register", data),

  login: (data: { identifier: string; password: string }) =>
    post<{ access_token: string; token_type: string; user: ApiUser }>("/auth/login", data),

  me: () => get<ApiUser>("/auth/me"),

  sendVerification: () => post<{ message: string }>("/auth/send-verification"),

  verifyEmail: (code: string) => post<ApiUser>("/auth/verify-email", { code }),
};

/* ── Pets ───────────────────────────────────────────────────────────────── */
export const petsApi = {
  list:   ()                              => get<ApiPet[]>("/pets"),
  create: (d: Omit<ApiPet, "id" | "owner_id" | "created_at">) => post<ApiPet>("/pets", d),
  update: (id: string, d: Partial<ApiPet>) => put<ApiPet>(`/pets/${id}`, d),
  delete: (id: string)                   => del(`/pets/${id}`),
};

/* ── Meals ──────────────────────────────────────────────────────────────── */
export const mealsApi = {
  list:   (petId: string)              => get<ApiMeal[]>(`/pets/${petId}/meals`),
  create: (petId: string, d: Omit<ApiMeal, "id" | "pet_id">) => post<ApiMeal>(`/pets/${petId}/meals`, d),
  update: (petId: string, id: string, d: Partial<ApiMeal>)   => put<ApiMeal>(`/pets/${petId}/meals/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/meals/${id}`),
};

export const mealLogsApi = {
  list:   (petId: string, date?: string) =>
    get<ApiMealLog[]>(`/pets/${petId}/meal-logs${date ? `?date=${date}` : ""}`),
  toggle: (petId: string, meal_id: string, date: string, fed_at?: number) =>
    post<ApiMealLog>(`/pets/${petId}/meal-logs/toggle`, { meal_id, date, fed_at: fed_at ?? null }),
};

/* ── Health ─────────────────────────────────────────────────────────────── */
export const vaccinationsApi = {
  list:   (petId: string)              => get<ApiVaccination[]>(`/pets/${petId}/vaccinations`),
  create: (petId: string, d: Omit<ApiVaccination, "id" | "pet_id">) => post<ApiVaccination>(`/pets/${petId}/vaccinations`, d),
  update: (petId: string, id: string, d: Partial<ApiVaccination>)   => put<ApiVaccination>(`/pets/${petId}/vaccinations/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/vaccinations/${id}`),
};

export const healthApi = {
  list:   (petId: string)              => get<ApiHealthRecord[]>(`/pets/${petId}/health`),
  create: (petId: string, d: Omit<ApiHealthRecord, "id" | "pet_id">) => post<ApiHealthRecord>(`/pets/${petId}/health`, d),
  update: (petId: string, id: string, d: Partial<ApiHealthRecord>)   => put<ApiHealthRecord>(`/pets/${petId}/health/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/health/${id}`),
};

/* ── Growth ─────────────────────────────────────────────────────────────── */
export const weightsApi = {
  list:   (petId: string)              => get<ApiWeightEntry[]>(`/pets/${petId}/weights`),
  create: (petId: string, d: Omit<ApiWeightEntry, "id" | "pet_id">) => post<ApiWeightEntry>(`/pets/${petId}/weights`, d),
  update: (petId: string, id: string, d: Partial<ApiWeightEntry>)   => put<ApiWeightEntry>(`/pets/${petId}/weights/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/weights/${id}`),
};

/* ── Expenses ───────────────────────────────────────────────────────────── */
export const expensesApi = {
  list:   (petId: string)              => get<ApiExpense[]>(`/pets/${petId}/expenses`),
  create: (petId: string, d: Omit<ApiExpense, "id" | "pet_id">) => post<ApiExpense>(`/pets/${petId}/expenses`, d),
  update: (petId: string, id: string, d: Partial<ApiExpense>)   => put<ApiExpense>(`/pets/${petId}/expenses/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/expenses/${id}`),
};

/* ── Milestones ─────────────────────────────────────────────────────────── */
export const milestonesApi = {
  list:   (petId: string)              => get<ApiMilestone[]>(`/pets/${petId}/milestones`),
  create: (petId: string, d: Omit<ApiMilestone, "id" | "pet_id">) => post<ApiMilestone>(`/pets/${petId}/milestones`, d),
  update: (petId: string, id: string, d: Partial<ApiMilestone>)   => put<ApiMilestone>(`/pets/${petId}/milestones/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/milestones/${id}`),
};

/* ── Memories ───────────────────────────────────────────────────────────── */
export const memoriesApi = {
  list:   (petId: string)              => get<ApiMemory[]>(`/pets/${petId}/memories`),
  create: (petId: string, d: Omit<ApiMemory, "id" | "pet_id">) => post<ApiMemory>(`/pets/${petId}/memories`, d),
  update: (petId: string, id: string, d: Partial<ApiMemory>)   => put<ApiMemory>(`/pets/${petId}/memories/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/memories/${id}`),
};

/* ── Calendar ───────────────────────────────────────────────────────────── */
export const calendarApi = {
  list: (petId: string) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hhmm  = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    return get<ApiCalendarEvent[]>(`/pets/${petId}/events?today=${today}&now_hhmm=${hhmm}`);
  },
  create: (petId: string, d: Omit<ApiCalendarEvent, "id" | "pet_id">) => post<ApiCalendarEvent>(`/pets/${petId}/events`, d),
  update: (petId: string, id: string, d: Partial<ApiCalendarEvent>)   => put<ApiCalendarEvent>(`/pets/${petId}/events/${id}`, d),
  delete: (petId: string, id: string) => del(`/pets/${petId}/events/${id}`),
};

/* ── Chat ───────────────────────────────────────────────────────────────── */
export const chatApi = {
  history: (pet_id?: string) =>
    get<ApiChatMessage[]>(`/user/chat/history${pet_id ? `?pet_id=${pet_id}` : ""}`),
  send: (text: string, pet_id?: string, image_base64?: string) =>
    post<{ user_msg: ApiChatMessage; ai_msg: ApiChatMessage }>("/user/chat/send", { text, pet_id, image_base64 }),
};

/* ── Documents ──────────────────────────────────────────────────────────── */
export const documentsApi = {
  list:   () => get<ApiDocument[]>("/user/documents"),
  create: (d: Omit<ApiDocument, "id" | "user_id">) => post<ApiDocument>("/user/documents", d),
  delete: (id: string) => del(`/user/documents/${id}`),
};

/* ── Alerts ─────────────────────────────────────────────────────────────── */
export const alertsApi = {
  list: () => get<ApiAlertRecord[]>("/user/alerts"),
  upsertBatch: (alerts: ApiAlertRecordIn[]) =>
    post<{ upserted: number }>("/user/alerts/upsert-batch", alerts),
};

/* ── Settings / Vet / Activity ──────────────────────────────────────────── */
export const userApi = {
  getMe: ()                             => get<ApiUser>("/user/me"),
  updatePhoto: (photo_url: string)      => req<ApiUser>("PATCH", "/user/profile", { photo_url }),
  getSettings: ()                       => get<ApiSettings>("/user/settings"),
  updateSettings: (d: Partial<ApiSettings>) => put<ApiSettings>("/user/settings", d),
  getVet: ()                            => get<ApiVet | null>("/user/vet"),
  upsertVet: (d: Omit<ApiVet, "id" | "owner_id">) => put<ApiVet>("/user/vet", d),
  deleteVet: ()                         => del("/user/vet"),
  getActivity: ()                       => get<ApiActivity>("/user/activity"),
  recordActivity: ()                    => post<ApiActivity>("/user/activity"),
  requestDeletion: ()                   => req<void>("POST", "/user/request-deletion"),
};

export const accountApi = {
  cancelDeletion: (identifier: string, password: string) =>
    post<{ access_token: string; token_type: string; user: ApiUser }>("/auth/cancel-deletion", { identifier, password }),
};

/* ── API shape types (snake_case — match FastAPI schemas) ───────────────── */
export interface ApiUser {
  id: string; name: string; username: string; email: string; email_verified?: boolean; photo_url?: string; created_at: string;
}
export interface ApiActivity {
  dates: string[]; streak: number; streak_broken: boolean;
}
export interface ApiPet {
  id: string; owner_id: string; name: string; species: string; breed: string;
  gender: string; dob: string; weight: string; photo_url: string;
  region: string; notes: string; created_at: string;
}
export interface ApiMeal {
  id: string; pet_id: string; name: string; time: string; food: string; kcal: number;
}
export interface ApiMealLog {
  id: string; pet_id: string; meal_id: string; date: string; done: boolean;
  fed_at?: number | null;
}
export interface ApiVaccination {
  id: string; pet_id: string; name: string; date: string; next_due: string; clinic: string;
}
export interface ApiWeightEntry {
  id: string; pet_id: string; weight: number; date: string; note: string;
}
export interface ApiHealthRecord {
  id: string; pet_id: string; kind: string; title: string; detail: string; date: string; active: boolean;
}
export interface ApiExpense {
  id: string; pet_id: string; category: string; amount: number; date: string; note: string; receipt_url: string;
}
export interface ApiMilestone {
  id: string; pet_id: string; emoji: string; title: string; date: string;
}
export interface ApiMemory {
  id: string; pet_id: string; photo_url: string; caption: string; date: string;
  title?: string; mood?: string; tags?: string; media_type?: string; time_taken?: string;
}
export interface ApiCalendarEvent {
  id: string; pet_id: string; title: string; date: string; time: string; all_day: boolean; emoji: string;
}
export interface ApiVet {
  id: string; owner_id: string; name: string; clinic: string; phone: string; alt_phone: string; address: string;
}
export interface ApiSettings {
  theme: string; push: boolean; email: boolean; sound: boolean;
  units: string; currency: string; language: string;
}
export interface ApiChatMessage {
  id: string; user_id: string; pet_id?: string | null;
  role: string; text: string; image_data?: string | null; created_at: string;
}
export interface ApiDocument {
  id: string; user_id: string; name: string; category: string;
  file_data: string; mime_type: string; uploaded_at: string;
}
export interface ApiAlertRecord {
  alert_key: string; user_id: string; pet_id?: string | null;
  emoji: string; title: string; body: string; when_display: string;
  when_ms?: number | null; group_name: string; color: string;
  sort_time?: number | null; status: string;
  created_at: number; expires_at: number;
}
export interface ApiAlertRecordIn {
  alert_key: string; pet_id?: string | null;
  emoji: string; title: string; body: string; when_display: string;
  when_ms?: number | null; group_name: string; color: string;
  sort_time?: number | null; status: string;
  created_at: number; expires_at: number;
}
