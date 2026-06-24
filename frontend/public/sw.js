self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.notification.close();

  if (action === "given") {
    // Notify the open page so it can mark the med as done in localStorage
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
    // Default / "open" action — just focus or open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
        for (const c of list) {
          if (c.url.includes(self.location.origin)) return c.focus();
        }
        return clients.openWindow("/");
      }),
    );
  }
});
