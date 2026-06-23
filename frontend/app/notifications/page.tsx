"use client";

/* PAWZO Notifications — real alerts derived from the store. Personality-driven
   messages, Web Audio API cute chime on new alerts. */

import { useState, useEffect, useRef } from "react";
import { AppFrame, BottomNav, TopBar, T } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, deriveAlerts } from "../lib/store";

/* cute ascending chime using Web Audio API — no external file needed */
function playCutePetSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.22, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    });
  } catch { /* no AudioContext — silently skip */ }
}

export default function NotificationsPage() {
  const { ready, authed } = useRequireAuth();
  const { state } = usePawzo();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const hasPlayedRef = useRef(false);

  const alerts = ready && authed ? deriveAlerts(state) : [];
  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  // play a cute chime once — the first time the page is ready with unread alerts
  useEffect(() => {
    if (!ready || !authed || hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    if (unreadCount > 0 && state.settings.sound) playCutePetSound();
  }, [ready, authed, unreadCount, state.settings.sound]);

  if (!ready || !authed) return null;

  const markRead = (id: string) => setReadIds((s) => new Set([...s, id]));
  const markAll = () => setReadIds(new Set(alerts.map((a) => a.id)));

  return (
    <AppFrame>
      <TopBar
        title="Alerts"
        back="/dashboard"
        right={
          unreadCount > 0 ? (
            <button
              onClick={markAll}
              className="pawzo-press"
              style={{ background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "7px 11px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: "4px 16px 0" }}>
        {alerts.length === 0 ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: "32px 20px", textAlign: "center", boxShadow: T.shadowSoft }}>
            <div className="pawzo-bob" style={{ fontSize: 42, marginBottom: 10 }}>🐾</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>All quiet</p>
            <p style={{ fontSize: 13, color: T.gray, marginTop: 4, lineHeight: 1.5 }}>
              No alerts right now. Feed a meal, log a vaccine, or add a calendar event to see alerts here.
            </p>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <p style={{ fontSize: 12.5, color: T.gray, margin: "0 2px 12px" }}>
                You have <strong style={{ color: T.pink }}>{unreadCount}</strong> new alert{unreadCount > 1 ? "s" : ""}
              </p>
            )}

            {(["Today", "Upcoming"] as const).map((g) => {
              const items = alerts.filter((a) => a.group === g);
              if (!items.length) return null;
              return (
                <div key={g} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.grayLight, letterSpacing: 0.6, margin: "8px 2px 8px" }}>{g.toUpperCase()}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((n) => {
                      const isRead = readIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className="pawzo-press"
                          style={{
                            display: "flex", gap: 12, alignItems: "flex-start",
                            textAlign: "left", border: "none", cursor: "pointer",
                            background: isRead ? "var(--p-surface)" : "var(--p-surface-2)",
                            borderRadius: 16, padding: "13px 14px", boxShadow: T.shadowSoft,
                          }}
                        >
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: n.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                            {n.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{n.title}</p>
                            <p style={{ fontSize: 12, color: T.gray, marginTop: 1, lineHeight: 1.4 }}>{n.body}</p>
                            <p style={{ fontSize: 10.5, color: T.grayLight, marginTop: 4 }}>{n.when}</p>
                          </div>
                          {!isRead && (
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: T.pink, flexShrink: 0, marginTop: 4 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}
