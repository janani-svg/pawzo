import os
import logging

logger = logging.getLogger("pawzo.email")


def _sendgrid_send(to_email: str, subject: str, body: str) -> None:
    api_key = os.getenv("SENDGRID_API_KEY", "")
    from_email = os.getenv("SMTP_FROM", "pawzopetcare@gmail.com")
    if not api_key:
        print(f"[pawzo] SENDGRID_API_KEY not set — cannot send email to {to_email}")
        return
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        sg = SendGridAPIClient(api_key)
        sg.send(message)
        print(f"[pawzo] Email sent via SendGrid to {to_email}")
    except Exception as e:
        logger.error("SendGrid failed: %s", e)
        print(f"[pawzo] SendGrid ERROR: {e}")
        raise


def send_verification_email(to_email: str, code: str, verify_link: str) -> None:
    subject = "Verify your Pawzo email"
    body = (
        f"Hi there! 🐾\n\n"
        f"Welcome to Pawzo! Verify your email using either option below:\n\n"
        f"Option 1 — Enter this code in the app:\n\n"
        f"    {code}\n\n"
        f"Option 2 — Click this link:\n\n"
        f"    {verify_link}\n\n"
        f"This code and link expire in 10 minutes. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    _sendgrid_send(to_email, subject, body)


def send_reset_email(to_email: str, reset_link: str, code: str) -> None:
    subject = "Reset your Pawzo password"
    body = (
        f"Hi there! 🐾\n\n"
        f"We received a request to reset your Pawzo password. Use either option below:\n\n"
        f"Option 1 — Enter this code in the app:\n\n"
        f"    {code}\n\n"
        f"Option 2 — Click this link to set a new password directly:\n\n"
        f"    {reset_link}\n\n"
        f"This code and link expire in 1 hour. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    _sendgrid_send(to_email, subject, body)
