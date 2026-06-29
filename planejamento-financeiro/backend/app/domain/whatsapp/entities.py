from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass
class WhatsAppAccount:
    id: str
    user_id: str
    phone_number: str
    provider: str
    provider_identity: str | None
    active: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class WhatsAppMessage:
    id: str
    user_id: str | None
    whatsapp_account_id: str | None
    provider: str
    provider_message_id: str | None
    direction: str
    message_type: str
    from_number: str
    to_number: str
    body: str | None
    media_url: str | None
    media_content_type: str | None
    transcription: str | None
    raw_payload: dict | None
    created_at: datetime


@dataclass
class WhatsAppTransactionDraft:
    id: str
    user_id: str
    whatsapp_message_id: str
    status: str
    kind: str
    title: str
    amount: Decimal
    category_id: str | None
    transaction_date: date
    confidence: Decimal | None
    ai_explanation: str | None
    original_text: str | None
    created_transaction_id: str | None
    created_at: datetime
    updated_at: datetime
