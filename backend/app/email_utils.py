import os
import smtplib
import logging
from email.message import EmailMessage

logger = logging.getLogger("pawzo.email")


def _smtp_send(msg: EmailMessage) -> None:
    smtp_host     = os.getenv("SMTP_HOST", "")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))
    smtp_user     = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_use_tls  = os.getenv("SMTP_USE_TLS", "true").lower() != "false"

    if not smtp_host:
        print(f"[pawzo] SMTP not configured — email to {msg['To']}:\n{msg.get_content()}")
        return

    print(f"[pawzo] Sending email to {msg['To']} via {smtp_host}:{smtp_port}")
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if smtp_use_tls:
                server.starttls()
            if smtp_user:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
        print(f"[pawzo] Email sent successfully to {msg['To']}")
    except Exception as e:
        logger.error("Failed to send email to %s: %s", msg["To"], e)
        print(f"[pawzo] SMTP ERROR: {e}")
        raise


def send_verification_email(to_email: str, code: str) -> None:
    smtp_from = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@pawzo.app"))
    msg = EmailMessage()
    msg["Subject"] = "Your Pawzo verification code"
    msg["From"]    = smtp_from
    msg["To"]      = to_email
    msg.set_content(
        f"Hi there! 🐾\n\n"
        f"Your Pawzo email verification code is:\n\n"
        f"    {code}\n\n"
        f"It expires in 10 minutes. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    _smtp_send(msg)


def send_reset_email(to_email: str, reset_link: str) -> None:
    smtp_from = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@pawzo.app"))
    msg = EmailMessage()
    msg["Subject"] = "Reset your Pawzo password"
    msg["From"]    = smtp_from
    msg["To"]      = to_email
    msg.set_content(
        f"Hi there! 🐾\n\n"
        f"We received a request to reset your Pawzo password.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"    {reset_link}\n\n"
        f"This link expires in 1 hour. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    _smtp_send(msg)
