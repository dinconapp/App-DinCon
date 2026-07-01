from datetime import date
from pydantic import BaseModel, Field


class WhatsAppAccountCreate(BaseModel):
    user_id: str
    phone_number: str
    alias: str = Field(min_length=1, max_length=120)
    provider: str = Field(default="twilio", pattern="^twilio$")


class WhatsAppAccountUpdate(BaseModel):
    alias: str | None = Field(default=None, max_length=120)
    phone_number: str | None = None
    active: bool | None = None


class WhatsAppAccountOut(BaseModel):
    id: str
    user_id: str
    phone_number: str
    phone_number_e164: str | None = None
    phone_number_masked: str | None = None
    alias: str | None = None
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
