from typing import Any
from pydantic import BaseModel, Field


class CheckoutPixRequest(BaseModel):
    user_id: str
    plan_code: str = Field(min_length=1, max_length=60)


class CheckoutCardRequest(BaseModel):
    user_id: str
    plan_code: str = Field(min_length=1, max_length=60)
    card_token: str | None = Field(default=None, max_length=300)
    token: str | None = Field(default=None, max_length=300)
    installments: int = Field(default=1, ge=1, le=12)
    payment_method_id: str | None = Field(default=None, max_length=60)
    issuer_id: str | None = Field(default=None, max_length=60)
    payer_identification_type: str | None = Field(default=None, max_length=20)
    payer_identification_number: str | None = Field(default=None, max_length=40)
    mock: bool = False


class PlanOut(BaseModel):
    id: str
    code: str
    name: str
    description: str | None
    price_cents: int
    currency: str
    billing_interval: str
    features: list[Any]


class PaymentOut(BaseModel):
    id: str
    user_id: str
    plan_id: str | None
    subscription_id: str | None
    provider: str
    provider_payment_id: str | None
    payment_method: str
    status: str
    amount_cents: int
    currency: str
    description: str | None
    qr_code: str | None
    qr_code_base64: str | None
    checkout_url: str | None
    external_reference: str | None
    sandbox: bool
    paid_at: str | None
    expires_at: str | None
    created_at: str | None


class SubscriptionOut(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: str
    provider: str
    current_period_start: str | None
    current_period_end: str | None
    cancel_at_period_end: bool
