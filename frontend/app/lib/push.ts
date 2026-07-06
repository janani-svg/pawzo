const API = process.env.NEXT_PUBLIC_API_URL ?? "";

function urlB64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64  = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(token: string): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (typeof Notification === "undefined" || Notification.permission === "denied") return;

  try {
    // Fetch VAPID public key from backend
    console.log("[push] fetching VAPID key from", `${API}/push/vapid-public-key`);
    const res = await fetch(`${API}/push/vapid-public-key`);
    if (!res.ok) { console.warn("[push] VAPID key fetch failed:", res.status); return; }
    const { key } = await res.json() as { key: string };
    console.log("[push] got VAPID key, length:", key.length);

    const reg = await navigator.serviceWorker.ready;
    console.log("[push] service worker ready:", reg.active?.state);
    let sub   = await reg.pushManager.getSubscription();
    console.log("[push] existing subscription:", sub ? "yes" : "none");

    if (!sub) {
      console.log("[push] subscribing to push...");
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlB64ToUint8Array(key) as BufferSource,
      });
      console.log("[push] subscribed:", sub.endpoint.slice(0, 60));
    }

    // Register with backend (upsert)
    console.log("[push] sending subscription to backend...");
    const saveRes = await fetch(`${API}/push/subscribe`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
    console.log("[push] backend subscribe response:", saveRes.status);
  } catch (err) {
    console.warn("[push] subscribe failed:", err);
  }
}

export async function unsubscribeFromPush(token: string): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await fetch(`${API}/push/unsubscribe`, {
      method:  "DELETE",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
    await sub.unsubscribe();
  } catch (err) {
    console.warn("[push] unsubscribe failed:", err);
  }
}
