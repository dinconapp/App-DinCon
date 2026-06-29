from dataclasses import dataclass
from typing import Protocol


@dataclass
class IncomingWhatsAppMessage:
    provider_message_id: str | None
    from_number: str
    to_number: str
    body: str | None
    message_type: str
    media_url: str | None
    media_content_type: str | None
    raw_payload: dict


@dataclass
class DownloadedMedia:
    file_path: str
    content_type: str
    extension: str
    size_bytes: int


class WhatsAppProvider(Protocol):
    provider_name: str

    def parse_webhook(self, form: dict) -> IncomingWhatsAppMessage: ...
    def twiml_response(self, message: str) -> str: ...
    def download_media(self, media_url: str, content_type: str | None, message_sid: str | None = None) -> DownloadedMedia: ...
