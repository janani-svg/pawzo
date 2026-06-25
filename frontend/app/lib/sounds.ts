"use client";

let _ctx: AudioContext | null = null;
let _enabled = true;

export function setSoundEnabled(on: boolean) {
  _enabled = on;
}

function getCtx(): AudioContext | null {
  if (!_enabled || typeof window === "undefined") return null;
  try {
    if (!_ctx) {
      _ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return _ctx;
  } catch {
    return null;
  }
}

export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.032);
    g.gain.setValueAtTime(0.11, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch { /* no AudioContext */ }
}

// two-note ascending bird chirp
export function playChirp() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    [0, 0.15].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "sine";
      const base = 2600 + i * 500;
      osc.frequency.setValueAtTime(base, t + delay);
      osc.frequency.linearRampToValueAtTime(base * 1.35, t + delay + 0.09);
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.18, t + delay + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.13);
      osc.start(t + delay);
      osc.stop(t + delay + 0.15);
    });
  } catch { /* no AudioContext */ }
}
