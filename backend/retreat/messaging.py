"""
messaging.py — bulk SMS (via Termii) + bulk email helpers.

Add to settings.py:
    TERMII_API_KEY   = os.environ.get("TERMII_API_KEY", "")
    TERMII_SENDER_ID = os.environ.get("TERMII_SENDER_ID", "DLCF")
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@dlcf-retreat.org")
    # + normal EMAIL_BACKEND / EMAIL_HOST_* settings for send_mail to work.

Swap `send_sms` for Africa's Talking / Twilio later without touching callers —
it's the only place that knows about the SMS provider.
"""
import logging
import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

TERMII_URL = "https://api.ng.termii.com/api/sms/send"


def send_sms(numbers, message):
    """Send one SMS to each number in `numbers` (list[str] or single str).

    Returns a list of {"to": number, "ok": bool, "detail": ...} dicts so the
    caller can report exactly how many actually went out.
    """
    if isinstance(numbers, str):
        numbers = [numbers]

    api_key = getattr(settings, "TERMII_API_KEY", "")
    if not api_key:
        logger.warning("TERMII_API_KEY not configured — SMS not sent (dry run).")
        return [{"to": n, "ok": False, "detail": "SMS provider not configured"} for n in numbers]

    results = []
    for number in numbers:
        payload = {
            "to": number,
            "from": getattr(settings, "TERMII_SENDER_ID", "DLCF"),
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": api_key,
        }
        try:
            resp = requests.post(TERMII_URL, json=payload, timeout=10)
            results.append({"to": number, "ok": resp.ok, "detail": resp.text[:200]})
        except requests.RequestException as exc:
            logger.exception("SMS send failed for %s", number)
            results.append({"to": number, "ok": False, "detail": str(exc)})
    return results


def send_bulk_email(recipients, subject, message, html_message=None):
    """recipients: list of email strings, or (email, name) tuples.

    Sends one message per recipient (not one email with everyone in BCC) so
    each person only sees their own address. Returns count actually sent.
    """
    sent = 0
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@dlcf-retreat.org")

    for r in recipients:
        email = r[0] if isinstance(r, (list, tuple)) else r
        if not email:
            continue
        try:
            msg = EmailMultiAlternatives(subject, message, from_email, [email])
            if html_message:
                msg.attach_alternative(html_message, "text/html")
            msg.send(fail_silently=False)
            sent += 1
        except Exception:
            logger.exception("Email send failed for %s", email)
    return sent