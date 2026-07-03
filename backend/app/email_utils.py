import os
import smtplib
import logging
from email.message import EmailMessage

logger = logging.getLogger("pawzo.email")


def _send_via_sendgrid(to_email: str, subject: str, body: str) -> bool:
    api_key = os.getenv("SENDGRID_API_KEY", "")
    if not api_key:
        return False
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        from_email = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "pawzopetcare@gmail.com"))
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        sg = SendGridAPIClient(api_key)
        sg.send(message)
        print(f"[pawzo] Email sent via SendGrid to {to_email}")
        return True
    except Exception as e:
        logger.error("SendGrid failed: %s", e)
        print(f"[pawzo] SendGrid ERROR: {e}")
        return False


def _send_via_resend(to_email: str, subject: str, body: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        return False
    try:
        import resend
        resend.api_key = api_key
        from_email = os.getenv("RESEND_FROM", "Pawzo <onboarding@resend.dev>")
        resend.Emails.send({
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "text": body,
        })
        print(f"[pawzo] Email sent via Resend to {to_email}")
        return True
    except Exception as e:
        logger.error("Resend failed: %s", e)
        print(f"[pawzo] Resend ERROR: {e}")
        return False


def _smtp_send(msg: EmailMessage) -> None:
    smtp_host     = os.getenv("SMTP_HOST", "")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))
    smtp_user     = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_use_tls  = os.getenv("SMTP_USE_TLS", "true").lower() != "false"

    if not smtp_host:
        print(f"[pawzo] SMTP not configured — email to {msg['To']}:\n{msg.get_content()}")
        return

    print(f"[pawzo] Sending email to {msg['To']} via {smtp_host}:{smtp_port} tls={smtp_use_tls}")
    try:
        if smtp_use_tls:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                if smtp_user:
                    server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                if smtp_user:
                    server.login(smtp_user, smtp_password)
                server.send_message(msg)
        print(f"[pawzo] Email sent successfully to {msg['To']}")
    except Exception as e:
        logger.error("Failed to send email to %s: %s", msg["To"], e)
        print(f"[pawzo] SMTP ERROR: {e}")
        raise


def send_verification_email(to_email: str, code: str) -> None:
    subject = "Your Pawzo verification code"
    body = (
        f"Hi there! 🐾\n\n"
        f"Your Pawzo email verification code is:\n\n"
        f"    {code}\n\n"
        f"It expires in 10 minutes. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    if _send_via_sendgrid(to_email, subject, body):
        return
    if _send_via_resend(to_email, subject, body):
        return
    smtp_from = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@pawzo.app"))
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = smtp_from
    msg["To"]      = to_email
    msg.set_content(body)
    _smtp_send(msg)


def send_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Reset your Pawzo password"
    body = (
        f"Hi there! 🐾\n\n"
        f"We received a request to reset your Pawzo password.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"    {reset_link}\n\n"
        f"This link expires in 1 hour. If you didn't request this, ignore this email.\n\n"
        f"— The Pawzo team"
    )
    if _send_via_sendgrid(to_email, subject, body):
        return
    if _send_via_resend(to_email, subject, body):
        return
    smtp_from = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@pawzo.app"))
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = smtp_from
    msg["To"]      = to_email
    msg.set_content(body)
    _smtp_send(msg)
