import os
import smtplib
import logging
from email.message import EmailMessage

logger = logging.getLogger("pawzo.email")

SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@pawzo.app")
SMTP_USE_TLS  = os.getenv("SMTP_USE_TLS", "true").lower() != "false"


def send_verification_email(to_email: str, code: str) -> None:
    """Email a verification code to the user.

    If no SMTP server is configured, the code is logged to the console instead
    so the flow stays usable in local development.
    """
    subject = "Your Pawzo verification code"
    body = (
        f"Hi there! 🐾\n\n"
        f"Your Pawzo email verification code is:\n\n"
        f"    {code}\n\n"
        f"It expires in 10 minutes. If you didn't request this, you can ignore "
        f"this email.\n\n"
        f"— The Pawzo team"
    )

    if not SMTP_HOST:
        logger.warning(
            "SMTP not configured — verification code for %s is: %s", to_email, code
        )
        print(f"[pawzo] Verification code for {to_email}: {code}")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
