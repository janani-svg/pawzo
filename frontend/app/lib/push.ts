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
    const res = await fetch(`${API}/push/vapid-public-key`);
    if (!res.ok) return;
    const { key } = await res.json() as { key: string };

    const reg = await navigator.serviceWorker.ready;
    let sub   = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlB64ToUint8Array(key) as BufferSource,
      });
    }

    // Register with backend (upsert)
    await fetch(`${API}/push/subscribe`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
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
