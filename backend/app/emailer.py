import logging
import smtplib
import ssl
from email.message import EmailMessage

from .config import settings

logger = logging.getLogger("uvicorn.error")


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    """Send an email via SMTP. Without SMTP settings (local dev), print it to the console."""
    if not settings.smtp_host:
        logger.warning("SMTP not configured. Email to %s\nSubject: %s\n%s", to, subject, text)
        return

    msg = EmailMessage()
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, 465, context=ssl.create_default_context(), timeout=20) as s:
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
                if settings.smtp_use_tls:
                    s.starttls(context=ssl.create_default_context())
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
    except Exception:
        # Runs in a background task: log it, never crash the request.
        logger.exception("Failed to send email to %s", to)


def send_password_reset_email(to: str, link: str) -> None:
    minutes = settings.reset_token_expire_minutes
    text = (
        "We received a request to reset your Expense Tracker password.\n\n"
        f"Reset it here (valid for {minutes} minutes):\n{link}\n\n"
        "If you didn't ask for this, you can ignore this email."
    )
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="margin:0 0 12px">Reset your password</h2>
      <p>We received a request to reset your Expense Tracker password.</p>
      <p><a href="{link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="color:#666;font-size:13px">This link is valid for {minutes} minutes. If you didn't ask for this, ignore this email.</p>
    </div>"""
    send_email(to, "Reset your Expense Tracker password", text, html)
