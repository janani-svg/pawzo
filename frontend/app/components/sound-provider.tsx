"use client";

import { useEffect, useRef } from "react";
import { usePawzo, deriveAlerts } from "../lib/store";
import { setSoundEnabled, playClick, playChirp } from "../lib/sounds";

export function SoundProvider() {
  const { state } = usePawzo();
  const enabled = state.settings.sound;
  const chirpedRef = useRef(false);

  // keep the module-level flag in sync with the user's setting
  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);

  // attach a single capture-phase listener so every button click makes a sound
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!enabled) return;
      const el = e.target as HTMLElement;
      if (el.closest("button, [role=button]")) playClick();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [enabled]);

  // chirp once when unread alerts are first detected after login
  useEffect(() => {
    if (!enabled || !state.currentUserId || chirpedRef.current) return;
    const alerts = deriveAlerts(state);
    if (alerts.length > 0) {
      chirpedRef.current = true;
      playChirp();
    }
  }, [enabled, state.currentUserId, state]);

  return null;
}
