"use client";

/* PAWZO Notifications — real alerts derived from the store. Latest first,
   swipe left to dismiss, personality-driven messages, Web Audio chime. */

import { useState, useEffect, useRef } from "react";
import { AppFrame, BottomNav, TopBar, T } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, deriveAlerts, getReadAlertIds, markAlertsRead, type Alert } from "../lib/store";

function playCutePetSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const freqs = [523.25, 659.25, 783.99, 1046.5];
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
  } catch { /* no AudioContext */ }
}

/* ── Swipeable row — swipe left ≥ 80 px to dismiss ───────────────────── */
function SwipeableRow({ id, onDismiss, children }: { id: string; onDismiss: (id: string) => void; children: React.ReactNode }) {
  const [dx, setDx]     = useState(0);
  const [gone, setGone] = useState(false);
  const startX          = useRef(0);
  const active          = useRef(false);

  if (gone) return null;

  const THRESHOLD = 80;
  const opacity = dx < 0 ? Math.max(0.15, 1 + dx / 180) : 1;

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
      {/* red reveal behind the card */}
      <div style={{
        position: "absolute", inset: 0, background: "#FEE2E2",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        paddingRight: 18, borderRadius: 16,
      }}>
        <span style={{ fontSize: 20 }}>🗑️</span>
      </div>

      {/* draggable card */}
      <div
        style={{
          transform: `translateX(${Math.min(0, dx)}px)`,
          transition: active.current ? "none" : "transform 0.28s ease, opacity 0.28s ease",
          opacity,
          position: "relative",
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
          active.current = true;
        }}
        onTouchMove={(e) => {
          const d = e.touches[0].clientX - startX.current;
          if (d < 0) setDx(d);
        }}
        onTouchEnd={() => {
          active.current = false;
          if (dx < -THRESHOLD) {
            setGone(true);
            onDismiss(id);
          } else {
            setDx(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Alert card ─────────────────────────────────────────────────────────── */
function AlertCard({ n, isRead, onRead, onDismiss }: { n: Alert; isRead: boolean; onRead: () => void; onDismiss: (id: string) => void }) {
  return (
    <SwipeableRow key={n.id} id={n.id} onDismiss={onDismiss}>
      <button
        onClick={onRead}
        className="pawzo-press"
        style={{ width: "100%", display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", border: "none", cursor: "pointer", background: isRead ? "var(--p-surface)" : "var(--p-surface-2)", borderRadius: 16, padding: "13px 14px", boxShadow: T.shadowSoft }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: n.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
          {n.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{n.title}</p>
          <p style={{ fontSize: 12, color: T.gray, marginTop: 1, lineHeight: 1.4 }}>{n.body}</p>
          <p style={{ fontSize: 10.5, color: T.grayLight, marginTop: 4 }}>{n.when}</p>
        </div>
        {!isRead && <span style={{ width: 9, height: 9, borderRadius: "50%", background: T.pink, flexShrink: 0, marginTop: 4 }} />}
      </button>
    </SwipeableRow>
  );
}

export default function NotificationsPage() {
  const { ready, authed } = useRequireAuth();
  const { state } = usePawzo();
  const [readIds,   setReadIds]   = useState<Set<string>>(() => getReadAlertIds());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const prevCountRef = useRef(0);

  const allAlerts = deriveAlerts(state);
  const alerts = [...allAlerts]
    .filter((a) => !dismissed.has(a.id))
    .sort((a, b) => {
      // Completed alerts (user actions: fed, given, done) always rise above reminders
      const aComp = a.status === "completed" ? 0 : 1;
      const bComp = b.status === "completed" ? 0 : 1;
      if (aComp !== bComp) return aComp - bComp;
      return b.sortTime - a.sortTime;
    });
  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  useEffect(() => {
    if (unreadCount > 0 && prevCountRef.current === 0 && state.settings.sound) playCutePetSound();
    prevCountRef.current = unreadCount;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ids = allAlerts.map((a) => a.id);
    if (ids.length === 0) return;
    markAlertsRead(ids);
    setReadIds(getReadAlertIds());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || !authed) return null;

  const markRead = (id: string) => { markAlertsRead([id]); setReadIds(getReadAlertIds()); };
  const markAll  = () => { markAlertsRead(alerts.map((a) => a.id)); setReadIds(getReadAlertIds()); };
  const dismiss  = (id: string) => { setDismissed((s) => new Set([...s, id])); markAlertsRead([id]); setReadIds(getReadAlertIds()); };

  return (
    <AppFrame>
      <TopBar
        title="Notifications"
        back="/dashboard"
        right={unreadCount > 0 ? (
          <button onClick={markAll} className="pawzo-press" style={{ background: T.primarySoft, border: "1px solid #FBD0E4", borderRadius: 12, padding: "7px 11px", fontSize: 11.5, fontWeight: 700, color: T.pinkDeep, cursor: "pointer" }}>
            Mark all read
          </button>
        ) : undefined}
      />

      <div style={{ padding: "0 16px 0" }}>
        {alerts.length === 0 && !(state.pastAlerts ?? []).length ? (
          <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: "32px 20px", textAlign: "center", boxShadow: T.shadowSoft }}>
            <div className="pawzo-bob" style={{ fontSize: 42, marginBottom: 10 }}>🐾</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>All quiet</p>
            <p style={{ fontSize: 13, color: T.gray, marginTop: 4, lineHeight: 1.5 }}>No alerts right now. Feed a meal, log a vaccine, or add a calendar event to see alerts here.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 10.5, color: T.grayLight, margin: "0 2px 10px", fontStyle: "italic" }}>Swipe left to dismiss</p>
            {(["Today", "Upcoming"] as const).map((g) => {
              const items = alerts.filter((a) => a.group === g);
              if (!items.length) return null;
              return (
                <div key={g} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.grayLight, letterSpacing: 0.6, margin: "8px 2px 8px" }}>{g.toUpperCase()}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((n) => (
                      <AlertCard key={n.id} n={n} isRead={readIds.has(n.id)} onRead={() => markRead(n.id)} onDismiss={dismiss} />
                    ))}
                  </div>
                </div>
              );
            })}
            {(() => {
              const currentIds = new Set(allAlerts.map(a => a.id));
              const earlier = (state.pastAlerts ?? [])
                .filter(a => !currentIds.has(a.id) && !dismissed.has(a.id))
                .sort((a, b) => b.sortTime - a.sortTime);
              if (!earlier.length) return null;
              return (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.grayLight, letterSpacing: 0.6, margin: "8px 2px 8px" }}>EARLIER THIS WEEK</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {earlier.map(n => (
                      <AlertCard key={n.id} n={n} isRead={readIds.has(n.id)} onRead={() => markRead(n.id)} onDismiss={dismiss} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}
