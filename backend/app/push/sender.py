import os
import json
import logging
from pywebpush import webpush, WebPushException

log = logging.getLogger(__name__)

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL       = os.getenv("VAPID_EMAIL", "pawzopetcare@gmail.com")


def send_push(endpoint: str, p256dh: str, auth: str, title: str, body: str, url: str = "/dashboard") -> bool:
    """Send a Web Push notification. Returns False if the subscription is stale/expired."""
    if not VAPID_PRIVATE_KEY:
        log.warning("VAPID_PRIVATE_KEY not configured — skipping push notification")
        return True  # don't delete subscription, just not configured yet
    try:
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"},
            ttl=86400,
        )
        return True
    except WebPushException as ex:
        # pywebpush 2.x may leave ex.response=None; parse status from message
        status = None
        if ex.response is not None:
            try:
                status = ex.response.status_code
            except Exception:
                pass
        if status is None:
            msg = str(ex)
            if "410" in msg or "Gone" in msg:
                status = 410
            elif "404" in msg or "Not Found" in msg:
                status = 404
        print(f"[push] WebPush failed status={status}: {ex}")
        if status in (404, 410):
            return False  # subscription gone — caller should delete it
        return True
    except Exception as ex:
        log.error("WebPush unexpected error: %s", ex)
        return True
