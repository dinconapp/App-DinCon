from datetime import datetime, timedelta, timezone


PIX_EXPIRATION_MINUTES = 3
PIX_EXPIRATION_SECONDS = PIX_EXPIRATION_MINUTES * 60

PLAN_DEFINITIONS = [
    {
        "code": "free",
        "name": "Gratis",
        "description": "Plano inicial para organizar o planejamento financeiro.",
        "price_cents": 0,
        "features": ["Dashboard", "Planejamento", "Transacoes", "Cofrinho"],
    },
    {
        "code": "pro",
        "name": "Pro",
        "description": "Recursos avancados de IA, WhatsApp e organizacao recorrente.",
        "price_cents": 2990,
        "features": ["Tudo do Gratis", "WhatsApp com IA", "Projecoes", "Historico de pagamentos"],
    },
    {
        "code": "premium",
        "name": "Premium",
        "description": "Mais capacidade para uso recorrente e automacoes financeiras.",
        "price_cents": 5990,
        "features": ["Tudo do Pro", "Maior volume de uso", "Recursos premium futuros"],
    },
]


class BillingError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def payment_expires_at() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=PIX_EXPIRATION_MINUTES)


def payment_expires_in_seconds() -> int:
    return PIX_EXPIRATION_SECONDS


def period_end() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=30)


def map_provider_status(status: str | None) -> str:
    value = (status or "").lower()
    if value == "approved":
        return "paid"
    if value == "in_process":
        return "processing"
    if value in {"pending", "authorized"}:
        return "pending"
    if value == "expired":
        return "expired"
    if value in {"rejected", "cancelled", "canceled", "refunded", "charged_back"}:
        return "failed"
    return "pending"


def safe_provider_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        return {}
    blocked = {"token", "card_token", "cardToken", "security_code", "securityCode"}
    return {key: ("***" if key in blocked else value) for key, value in payload.items()}
