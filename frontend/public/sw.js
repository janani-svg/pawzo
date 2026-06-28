self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

/* ── Store pet schedule posted from the app ─────────────────────────── */
self.addEventListener("message", (event) => {
  if (event.data?.type === "STORE_SCHEDULE") {
    caches.open("pawzo-v1").then((c) =>
      c.put("/__schedule", new Response(JSON.stringify(event.data.payload)))
    ).catch(() => {});
  }

  if (event.data?.type === "MED_GIVEN_FROM_NOTIF") {
    // handled by the app page via the message listener in NotificationScheduler
  }
});

/* ── Periodic background sync (fires ~daily, even when app is closed) ── */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-reminder") {
    event.waitUntil(showDailyReminder());
  }
});

const DAILY_MSGS = [
  (names) => ({ title: `🐾 ${names} misses you!`,        body: `Don't forget to log today's meals and check in with your furry friend on Pawzo!` }),
  (names) => ({ title: `🍽️ Feeding time check!`,         body: `Have ${names} been fed today? Open Pawzo to log their meals and keep the streak alive! 🔥` }),
  (names) => ({ title: `❤️ Your pet needs you`,           body: `${names} is waiting for their care log. A quick tap keeps their health story complete!` }),
  (names) => ({ title: `🌟 Paw-some reminder!`,           body: `Tap to check in with Pawzo and make sure ${names} has everything they need today.` }),
  (names) => ({ title: `🔥 Streak on the line!`,          body: `Open Pawzo and log ${names}'s meals before the day ends — don't break the streak!` }),
  (names) => ({ title: `😺 ${names} sent a memo`,        body: `"Human, you forgot to log my meals again." — ${names}. Tap to keep their timeline perfect!` }),
];

async function showDailyReminder() {
  try {
    const cache  = await caches.open("pawzo-v1");
    const res    = await cache.match("/__schedule");
    if (!res) return;
    const { pets } = await res.json();
    if (!pets?.length) return;

    const names = pets.length === 1
      ? pets[0].name
      : pets.slice(0, 2).map((p) => p.name).join(" & ");

    const pool = DAILY_MSGS;
    const msg  = pool[Math.floor(Math.random() * pool.length)](names);

    await self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag:  "daily-reminder",
      data: { url: "/dashboard" },
      requireInteraction: false,
    });
  } catch { /* silent */ }
}

/* ── Notification click ──────────────────────────────────────────────── */
self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.notification.close();

  if (action === "given") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
        const tag = event.notification.tag || "";
        for (const c of list) {
          c.postMessage({ type: "MED_GIVEN_FROM_NOTIF", tag });
          return c.focus();
        }
        return clients.openWindow("/dashboard");
      }),
    );
  } else {
    const targetUrl = event.notification.data?.url || "/dashboard";
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
        for (const c of list) {
          if (c.url.includes(self.location.origin)) return c.focus();
        }
        return clients.openWindow(targetUrl);
      }),
    );
  }
});
