from datetime import date
from pydantic import BaseModel, Field


class WhatsAppAccountCreate(BaseModel):
    user_id: str
    phone_number: str
    provider: str = Field(default="twilio", pattern="^twilio$")


class WhatsAppAccountOut(BaseModel):
    id: str
    user_id: str
    phone_number: str
    provider: str
    provider_identity: str | None = None
    active: bool
    created_at: str
    updated_at: str


class WhatsAppTransactionDraftOut(BaseModel):
    id: str
    user_id: str
    whatsapp_message_id: str
    status: str
    kind: str
    title: str
    amount: float
    category_id: str | None = None
    transaction_date: date
    confidence: float | None = None
    ai_explanation: str | None = None
    original_text: str | None = None
    created_transaction_id: str | None = None
    created_at: str
    updated_at: str
