import type { State } from "./store";

type StateRef = { current: State };

/* ── Creative message pools ──────────────────────────────────────────── */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Msg = { title: string; body: string };

/* Meal — 10 min before */
const MEAL_WAITING: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🍳 Chef mode: ON`, body: `${n}'s ${m} is coming up in 10 minutes! Time to get the bowl ready. 🐾` }),
  (n, m) => ({ title: `⏰ 10 minutes to ${m} time!`, body: `${n} has their nose in the air already. Something smells delicious!` }),
  (n, m) => ({ title: `🌟 Almost time, ${n}!`, body: `${n} is doing their best "feed me" eyes right now. ${m} in 10 min!` }),
  (n, m) => ({ title: `🐾 Tummy clock is ticking`, body: `${n} can hear the clock ticking toward ${m} time. 10 minutes to go!` }),
  (n, m) => ({ title: `👀 ${n} is watching you`, body: `Those adorable eyes haven't moved from the food bowl. ${m} in 10 min!` }),
];

/* Meal — exact time */
const MEAL_HUNGRY: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🍽️ It's ${m} o'clock!`, body: `${n}'s stomach just sent an official hunger notification. Time to serve up!` }),
  (n, m) => ({ title: `🔔 ${n}: "Excuse me, human!"`, body: `${n} would like to formally announce that it is now ${m} time. Please report to the food bowl. 🐾` }),
  (n, m) => ({ title: `😋 Hunger level: MAXIMUM`, body: `${n} has activated full dramatic mode. The ${m} bowl awaits its destiny!` }),
  (n, m) => ({ title: `🌮 ${m} time — right now!`, body: `${n} is patiently (not really) waiting for their ${m}. Open the app to mark it done!` }),
  (n, m) => ({ title: `📢 BREAKING: ${n} is hungry`, body: `Live update from ${n}: "I have been waiting forever and the ${m} bowl is still empty." — ${n}` }),
];

/* Meal — 10 min after, not fed */
const MEAL_SKIPPED: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🕰️ ${n}'s ${m} is 10 min late`, body: `${n} filed a formal complaint with the Pawzo Bureau of Hungry Pets. Log the meal to resolve it! 🐾` }),
  (n, m) => ({ title: `📋 Quick check-in needed!`, body: `${n}'s ${m} window passed 10 min ago. Did you feed them? Tap to log it and keep the streak going! 🔥` }),
  (n, m) => ({ title: `🐾 ${n}'s ${m} reminder`, body: `Hey, life gets busy! If ${n} ate already, open Pawzo and check it off to keep their timeline perfect.` }),
  (n, m) => ({ title: `💭 Psst — ${n} sent a message`, body: `"I may or may not have had my ${m}…" — ${n}. Open the app to log and keep track!` }),
  (n, m) => ({ title: `⚡ Quick tap needed`, body: `${n}'s ${m} is unlogged. 2 seconds in Pawzo keeps their whole health story complete. Tap to check it off!` }),
];

const MED_MORNING: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `☀️ Good morning! Time for ${n}'s ${m}`, body: `Start ${n}'s day the healthy way — their medication is due!` }),
  (n, m) => ({ title: `🌅 Rise & shine, ${n}!`, body: `Before the morning rush — don't forget ${n}'s ${m}.` }),
  (n, m) => ({ title: `💊 Daily dose time!`, body: `${n} is counting on you. Their ${m} is ready and waiting!` }),
  (n, m) => ({ title: `🐾 ${n}'s morning routine`, body: `It's ${m} o'clock! Keep ${n} healthy, one day at a time.` }),
  (n, m) => ({ title: `🌸 Morning med check!`, body: `A little ${m} goes a long way for ${n}. Time to dose up!` }),
];

const MED_MIDDAY: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🌤️ Midday check-in for ${n}`, body: `Hey! Did ${n} get their ${m} yet? Still plenty of time!` }),
  (n, m) => ({ title: `⏰ Afternoon nudge`, body: `Halfway through the day — ${n}'s ${m} is still waiting.` }),
  (n, m) => ({ title: `🍽️ Lunchtime reminder`, body: `While you take a break, don't forget ${n}'s ${m}!` }),
  (n, m) => ({ title: `🔔 ${n} needs their meds!`, body: `The afternoon is ticking. ${m} for ${n} hasn't been given yet.` }),
];

const MED_EVENING: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🌆 Evening alert: ${n}'s ${m}`, body: `${n} still hasn't had their ${m}. Please give it before bedtime!` }),
  (n, m) => ({ title: `🌇 Don't let the day slip away`, body: `${n}'s ${m} is still pending. It's getting late — take a moment now!` }),
  (n, m) => ({ title: `⚠️ Medication still pending!`, body: `Evening is here and ${n} hasn't had their ${m}. Please don't skip!` }),
  (n, m) => ({ title: `🏥 ${n}'s health matters`, body: `A missed dose of ${m} can affect ${n}'s progress. Give it now!` }),
];

const MED_NIGHT: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `🌙 Last chance tonight!`, body: `${n}'s ${m} hasn't been given today. Please do it before bed!` }),
  (n, m) => ({ title: `🌛 Bedtime reminder for ${n}`, body: `Before ${n} settles in for the night — their ${m} is still due!` }),
  (n, m) => ({ title: `😴 Almost bedtime…`, body: `One last reminder: ${n} needs their ${m} before the night is over.` }),
  (n, m) => ({ title: `🔔 Final reminder for ${n}`, body: `Don't let today end without giving ${n} their ${m}. It matters!` }),
];

const MED_SKIPPED: Array<(n: string, m: string) => Msg> = [
  (n, m) => ({ title: `💔 ${n} missed their ${m} yesterday`, body: `Yesterday's dose was skipped. Let's stay on track today for ${n}'s health!` }),
  (n, m) => ({ title: `😿 Missed medication alert`, body: `${n} didn't receive their ${m} yesterday. Check in with your vet if this keeps happening.` }),
  (n, m) => ({ title: `📋 Medication log: skipped`, body: `${n}'s ${m} was not given yesterday. Consistency is key to their recovery!` }),
  (n, m) => ({ title: `🐾 ${n} is counting on you!`, body: `Yesterday's ${m} was missed. Fresh start today — let's not skip again!` }),
];

/* ── Notification helpers ────────────────────────────────────────────── */

function notify(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon: "/favicon.ico" }); } catch { /* ignore */ }
}

async function notifyInteractive(title: string, body: string, tag: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    // getRegistration() returns immediately — never hangs like .ready does
    const reg = "serviceWorker" in navigator
      ? await navigator.serviceWorker.getRegistration().catch(() => undefined)
      : undefined;
    if (reg && "showNotification" in reg) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (reg as any).showNotification(title, {
        body,
        icon: "/favicon.ico",
        tag,
        actions: [
          { action: "given", title: "✅ Mark as Given" },
          { action: "open",  title: "🏠 Open App" },
        ],
        requireInteraction: false,
      });
    } else {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  } catch { /* ignore */ }
}

/** Returns true if today's med-done key in localStorage contains this med */
function isMedGivenToday(medId: string, today: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(`pawzo:med-done-${today}`);
    if (!saved) return false;
    return (JSON.parse(saved) as string[]).includes(`med-${medId}`);
  } catch { return false; }
}

/** ms from now until today at HH:MM + offsetMinutes. Negative = already passed. */
function msUntil(hhmm: string, offsetMinutes = 0): number {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  target.setTime(target.getTime() + offsetMinutes * 60_000);
  return target.getTime() - Date.now();
}

/** ms until tomorrow at HH:MM */
function msUntilTomorrow(hhmm: string): number {
  return msUntil(hhmm) + 24 * 60 * 60_000;
}

/* ── Main scheduler ──────────────────────────────────────────────────── */

export function scheduleNotifications(state: State, stateRef: StateRef): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  /** Schedule a plain notification, skipped if time already passed */
  const schedule = (
    delayMs: number,
    title: string,
    body: string,
    guard?: () => boolean,
  ) => {
    if (delayMs <= 0) return;
    timers.push(setTimeout(() => {
      if (guard && !guard()) return;
      notify(title, body);
    }, delayMs));
  };

  /** Schedule an interactive SW notification */
  const scheduleI = (
    delayMs: number,
    msg: Msg,
    tag: string,
    guard?: () => boolean,
  ) => {
    if (delayMs <= 0) return;
    timers.push(setTimeout(() => {
      if (guard && !guard()) return;
      notifyInteractive(msg.title, msg.body, tag);
    }, delayMs));
  };

  for (const pet of state.pets) {

    /* ── Meals ───────────────────────────────────────────────────────── */
    for (const meal of state.meals.filter((m) => m.petId === pet.id)) {
      if (!meal.time) continue;

      const notFed = () =>
        !stateRef.current.mealLogs.find(
          (l) => l.petId === pet.id && l.mealId === meal.id && l.date === today && l.done,
        );

      const waiting = pick(MEAL_WAITING)(pet.name, meal.name);
      const hungry  = pick(MEAL_HUNGRY) (pet.name, meal.name);
      const skipped = pick(MEAL_SKIPPED)(pet.name, meal.name);

      schedule(msUntil(meal.time, -10), waiting.title, waiting.body, notFed);
      schedule(msUntil(meal.time),      hungry.title,  hungry.body,  notFed);
      schedule(msUntil(meal.time, 10),  skipped.title, skipped.body, notFed);
    }

    /* ── Medications ─────────────────────────────────────────────────── */
    for (const med of state.health.filter(
      (h) => h.kind === "medication" && h.active && h.petId === pet.id,
    )) {
      const notGiven = () => !isMedGivenToday(med.id, today);
      const tag = `pawzo-med-${med.id.slice(0, 8)}-${today}`;

      // Pick a random creative variant for each slot (consistent within a schedule run)
      const morning = pick(MED_MORNING)(pet.name, med.title);
      const midday  = pick(MED_MIDDAY) (pet.name, med.title);
      const evening = pick(MED_EVENING)(pet.name, med.title);
      const night   = pick(MED_NIGHT)  (pet.name, med.title);
      const skipped = pick(MED_SKIPPED)(pet.name, med.title);

      scheduleI(msUntil("08:00"),          morning, `${tag}-am`, notGiven);
      scheduleI(msUntil("12:00"),          midday,  `${tag}-md`, notGiven);
      scheduleI(msUntil("18:00"),          evening, `${tag}-ev`, notGiven);
      scheduleI(msUntil("21:00"),          night,   `${tag}-nt`, notGiven);
      // Next morning: skipped alert (plain, no actions)
      schedule( msUntilTomorrow("08:00"),  skipped.title, skipped.body, notGiven);
    }

    /* ── Events ──────────────────────────────────────────────────────── */
    for (const event of state.events.filter((e) => e.petId === pet.id)) {
      const eventTime = event.time || "09:00";

      const isEventDone = () => {
        if (typeof window === "undefined") return false;
        try {
          const saved = localStorage.getItem(`pawzo:schedule-done-${today}`);
          if (!saved) return false;
          return (JSON.parse(saved) as string[]).includes(`event-${event.id}`);
        } catch { return false; }
      };
      const notDone = () => !isEventDone();

      if (event.date === tomorrow) {
        schedule(msUntil("09:00"),
          `Tomorrow: ${event.title} 📅`,
          `${event.title} for ${pet.name} is tomorrow` +
            (event.time ? ` at ${event.time}` : "") + ` — prepare in advance!`,
          notDone);
      }

      if (event.date === today) {
        schedule(msUntil(eventTime),
          `🎉 ${event.title} is starting now!`,
          `Time for ${event.title} with ${pet.name}! Tap to log it once done.`,
          notDone);

        schedule(msUntilTomorrow(eventTime),
          `😿 Did you miss ${event.title}?`,
          `${event.title} for ${pet.name} was scheduled yesterday — mark it done or check the calendar!`,
          notDone);
      }
    }
  }

  return () => timers.forEach(clearTimeout);
}
