import logging
from pathlib import Path
from datetime import datetime
import requests
from twilio.request_validator import RequestValidator
from twilio.twiml.messaging_response import MessagingResponse
from app.core.config import get_settings
from app.domain.whatsapp.providers import DownloadedMedia, IncomingWhatsAppMessage
from app.domain.whatsapp.services import normalize_phone

logger = logging.getLogger(__name__)

AUDIO_CONTENT_TYPES = {
    "audio/ogg",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/amr",
    "audio/webm",
    "audio/wav",
    "application/ogg",
}

EXTENSIONS_BY_CONTENT_TYPE = {
    "audio/ogg": ".ogg",
    "application/ogg": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".mp4",
    "audio/aac": ".aac",
    "audio/amr": ".amr",
    "audio/webm": ".webm",
    "audio/wav": ".wav",
}


class TwilioMediaDownloadError(Exception):
    pass


class TwilioMediaTooLargeError(TwilioMediaDownloadError):
    pass


class TwilioWhatsAppProvider:
    provider_name = "twilio"

    def __init__(self):
        self.settings = get_settings()

    def validate_signature(self, url: str, form: dict, signature: str | None) -> bool:
        if not self.settings.twilio_webhook_validate_signature:
            logger.info("twilio.signature.skipped validate_signature=false")
            return True
        if not self.settings.twilio_auth_token or not signature:
            logger.warning(
                "twilio.signature.missing auth_token_configured=%s has_signature=%s",
                bool(self.settings.twilio_auth_token),
                bool(signature),
            )
            return False
        is_valid = RequestValidator(self.settings.twilio_auth_token).validate(url, form, signature)
        logger.info("twilio.signature.validated valid=%s", is_valid)
        return is_valid

    def parse_webhook(self, form: dict) -> IncomingWhatsAppMessage:
        media_count = int(form.get("NumMedia") or 0)
        media_url = form.get("MediaUrl0") if media_count > 0 else None
        media_content_type = form.get("MediaContentType0") if media_count > 0 else None
        message_type = "text"
        if media_url and media_content_type:
            normalized_content_type = _base_content_type(media_content_type)
            message_type = "audio" if is_audio_content_type(media_content_type) else "image" if normalized_content_type.startswith("image/") else "unknown"
        logger.info(
            "twilio.webhook.parsed message_id=%s media_count=%s media_content_type=%s message_type=%s body_length=%s",
            form.get("MessageSid") or form.get("SmsMessageSid"),
            media_count,
            media_content_type,
            message_type,
            len(form.get("Body") or ""),
        )
        return IncomingWhatsAppMessage(
            provider_message_id=form.get("MessageSid") or form.get("SmsMessageSid"),
            from_number=normalize_phone(form.get("From", "")),
            to_number=normalize_phone(form.get("To", "")),
            body=form.get("Body") or None,
            message_type=message_type,
            media_url=media_url,
            media_content_type=media_content_type,
            raw_payload=dict(form),
        )

    def twiml_response(self, message: str) -> str:
        response = MessagingResponse()
        response.message(message)
        return str(response)

    def download_media(self, media_url: str, content_type: str | None, message_sid: str | None = None) -> DownloadedMedia:
        target_dir = Path(self.settings.whatsapp_audio_storage_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        max_bytes = max(1, self.settings.whatsapp_max_audio_mb) * 1024 * 1024
        logger.info(
            "whatsapp.audio.download.started message_sid=%s content_type=%s max_bytes=%s",
            message_sid,
            content_type,
            max_bytes,
        )
        try:
            response = requests.get(
                media_url,
                auth=(self.settings.twilio_account_sid, self.settings.twilio_auth_token),
                timeout=30,
                stream=True,
            )
            response.raise_for_status()
            chunks = []
            size_bytes = 0
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if not chunk:
                    continue
                size_bytes += len(chunk)
                if size_bytes > max_bytes:
                    raise TwilioMediaTooLargeError("Audio maior que o limite configurado.")
                chunks.append(chunk)
        except TwilioMediaTooLargeError:
            logger.warning("whatsapp.audio.download.too_large message_sid=%s max_bytes=%s", message_sid, max_bytes)
            raise
        except requests.RequestException as exc:
            logger.warning("whatsapp.audio.download.failed message_sid=%s status=%s", message_sid, getattr(exc.response, "status_code", None))
            raise TwilioMediaDownloadError("Falha ao baixar audio da Twilio.") from exc

        normalized_content_type = _base_content_type(content_type or response.headers.get("content-type", ""))
        extension = EXTENSIONS_BY_CONTENT_TYPE.get(normalized_content_type, ".ogg")
        safe_sid = "".join(ch for ch in (message_sid or "twilio_media") if ch.isalnum() or ch in {"_", "-"})
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        file_path = target_dir / f"{safe_sid}_{timestamp}{extension}"
        file_path.write_bytes(b"".join(chunks))
        logger.info(
            "whatsapp.audio.download.success message_sid=%s content_type=%s size_bytes=%s file=%s",
            message_sid,
            normalized_content_type,
            size_bytes,
            file_path.name,
        )
        return DownloadedMedia(
            file_path=str(file_path),
            content_type=normalized_content_type,
            extension=extension,
            size_bytes=size_bytes,
        )


def _base_content_type(content_type: str | None) -> str:
    return (content_type or "").split(";", 1)[0].strip().lower()


def is_audio_content_type(content_type: str | None) -> bool:
    return _base_content_type(content_type) in AUDIO_CONTENT_TYPES
