"use client";

import { useEffect, useRef, useState } from "react";
import { usePawzo } from "../lib/store";
import { scheduleNotifications } from "../lib/notif-scheduler";

export default function NotificationScheduler() {
  const { state } = usePawzo();
  const stateRef = useRef(state);
  stateRef.current = state;

  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));

  // One-time setup: register SW + request permission + arm midnight reset
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 5, 0);
    const timer = setTimeout(
      () => setToday(new Date().toISOString().slice(0, 10)),
      midnight.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [today]);

  // Handle "Mark as Given" action from interactive notification
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "MED_GIVEN_FROM_NOTIF") return;
      const tag: string = event.data.tag ?? "";
      // Tag format: "pawzo-med-{shortId}-{date}-{slot}"
      // Extract date portion — last segment before slot suffix (-am/-md/-ev/-nt)
      const dateMatch = tag.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
      const key = `pawzo:med-done-${date}`;
      try {
        const existing: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
        // We can't get the full medId from short tag, so store the raw tag;
        // the dashboard's isMedGivenToday helper checks for "med-{id}" prefix.
        // Store the full tag so at minimum notifications are suppressed.
        if (!existing.includes(tag)) {
          existing.push(tag);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch { /* ignore */ }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // Re-schedule whenever pets, meals, events, health, logs, or push setting change
  useEffect(() => {
    if (!state.pets.length) return;
    if (!state.settings.push) return;
    return scheduleNotifications(state, stateRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.pets,
    state.meals,
    state.events,
    state.health,
    state.mealLogs,
    state.settings.push,
    today,
  ]);

  return null;
}
