"use client";

import { useEffect, useRef } from "react";
import { usePawzo, deriveAlerts } from "../lib/store";
import { setSoundEnabled, playClick, playChirp } from "../lib/sounds";

export function SoundProvider() {
  const { state } = usePawzo();
  const enabled = state.settings.sound;
  const prevAlertCountRef = useRef<number | null>(null);

  // keep the module-level flag in sync with the user's setting
  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);

  // attach a single capture-phase listener so every button/link click makes a sound
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!enabled) return;
      const el = e.target as HTMLElement;
      if (el.closest("button, [role=button], a")) playClick();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [enabled]);

  // chirp when a NEW alert arrives while the user is logged in
  useEffect(() => {
    if (!enabled || !state.currentUserId) {
      prevAlertCountRef.current = null;
      return;
    }
    const count = deriveAlerts(state).length;
    if (prevAlertCountRef.current !== null && count > prevAlertCountRef.current) {
      playChirp();
    }
    prevAlertCountRef.current = count;
  }, [enabled, state.currentUserId, state]);

  return null;
}
