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
        status = ex.response.status_code if ex.response else None
        if status in (404, 410):
            return False  # subscription gone — caller should delete it
        log.error("WebPush failed (status=%s): %s", status, ex)
        return True
    except Exception as ex:
        log.error("WebPush unexpected error: %s", ex)
        return True
