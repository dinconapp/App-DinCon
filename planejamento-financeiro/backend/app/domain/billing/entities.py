from dataclasses import dataclass
from datetime import datetime


@dataclass
class Plan:
    id: str
    code: str
    name: str
    description: str | None
    price_cents: int
    currency: str
    billing_interval: str
    is_active: bool
    features: list
    created_at: datetime
    updated_at: datetime


@dataclass
class Payment:
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
    provider_payload: dict
    sandbox: bool
    paid_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
