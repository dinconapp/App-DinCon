import logging
from datetime import datetime, timezone
from uuid import uuid4

from app.core.exceptions import NotFoundError
from app.domain.billing.services import BillingError, map_provider_status, payment_expires_at, payment_expires_in_seconds, period_end, safe_provider_payload

logger = logging.getLogger(__name__)


def dt(value):
    return value.isoformat() if value else None


def utcnow_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def format_utc_millis_z(value: datetime | None) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def serialize_plan(plan):
    return {
        "id": plan.id,
        "code": plan.code,
        "name": plan.name,
        "description": plan.description,
        "price_cents": plan.price_cents,
        "currency": plan.currency,
        "billing_interval": plan.billing_interval,
        "features": plan.features or [],
    }


def serialize_payment(payment):
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "plan_id": payment.plan_id,
        "subscription_id": payment.subscription_id,
        "provider": payment.provider,
        "provider_payment_id": payment.provider_payment_id,
        "provider_payload": payment.provider_payload,
        "payment_method": payment.payment_method,
        "status": payment.status,
        "amount_cents": payment.amount_cents,
        "currency": payment.currency,
        "description": payment.description,
        "qr_code": payment.qr_code,
        "qr_code_base64": payment.qr_code_base64,
        "checkout_url": payment.checkout_url,
        "external_reference": payment.external_reference,
        "sandbox": payment.sandbox,
        "date_of_expiration": format_utc_millis_z(payment.expires_at) if payment.payment_method == "pix" else None,
        "expires_in_seconds": payment_expires_in_seconds() if payment.payment_method == "pix" and payment.expires_at else None,
        "paid_at": dt(payment.paid_at),
        "expires_at": dt(payment.expires_at),
        "created_at": dt(payment.created_at),
    }


def serialize_subscription(subscription):
    if not subscription:
        return None
    return {
        "id": subscription.id,
        "user_id": subscription.user_id,
        "plan_id": subscription.plan_id,
        "status": subscription.status,
        "provider": subscription.provider,
        "current_period_start": dt(subscription.current_period_start),
        "current_period_end": dt(subscription.current_period_end),
        "cancel_at_period_end": subscription.cancel_at_period_end,
    }


class BillingUseCases:
    def __init__(self, billing, users, provider, settings):
        self.billing = billing
        self.users = users
        self.provider = provider
        self.settings = settings

    def list_plans(self):
        return [serialize_plan(plan) for plan in self.billing.list_plans()]

    def config(self):
        return {
            "provider": self.settings.payments_provider,
            "mock_mode": self._use_mock_mode(),
            "environment": "production" if self.settings.is_production else self.settings.app_env,
            "public_key_configured": bool(self.settings.mercado_pago_public_key.strip()),
            "access_token_configured": bool(self.settings.mercado_pago_access_token.strip()),
            "public_key": self.settings.mercado_pago_public_key,
            "app_public_url": self.settings.app_public_url,
            "api_public_url": self.settings.api_public_url,
        }

    def user_billing(self, user_id: str):
        self.users.get(user_id)
        return {
            "subscription": serialize_subscription(self.billing.latest_subscription_by_user(user_id)),
            "payments": [serialize_payment(payment) for payment in self.billing.list_payments_by_user(user_id)],
        }

    def create_pix_checkout(self, user_id: str, plan_code: str):
        user = self.users.get(user_id)
        plan = self.billing.get_plan_by_code(plan_code)
        payment = self._create_pending_payment(user, plan, "pix")
        if self._use_mock_mode():
            payment = self.billing.update_payment(payment.id, {
                "provider": "mock",
                "provider_payment_id": f"mock_pix_{payment.id}",
                "qr_code": f"00020101021226880014br.gov.bcb.pix0136mock-{payment.id}",
                "provider_payload": {"mock": True, "status": "pending"},
            })
        else:
            payload = self._mercadopago_payload(user, plan, payment, "pix")
            provider_payload = self.provider.create_payment(payload)
            payment = self._apply_provider_payload(payment, provider_payload)
        return serialize_payment(payment)

    def create_card_checkout(self, payload):
        user = self.users.get(payload.user_id)
        plan = self.billing.get_plan_by_code(payload.plan_code)
        payment = self._create_pending_payment(user, plan, "card")
        if self._use_mock_mode() or payload.mock:
            payment = self.billing.update_payment(payment.id, {
                "provider": "mock",
                "provider_payment_id": f"mock_card_{payment.id}",
                "status": "paid",
                "paid_at": utcnow_naive(),
                "provider_payload": {"mock": True, "status": "paid"},
            })
            self._activate_subscription(user, plan, payment)
            payment = self.billing.get_payment(payment.id)
        else:
            token = payload.card_token or payload.token
            if not token:
                raise BillingError("Token do cartao nao informado.")
            provider_payload = self.provider.create_payment(self._mercadopago_payload(
                user,
                plan,
                payment,
                payload.payment_method_id or "visa",
                token=token,
                installments=payload.installments,
                issuer_id=payload.issuer_id,
                payer_identification_type=payload.payer_identification_type,
                payer_identification_number=payload.payer_identification_number,
                address=payload.address,
            ))
            payment = self._apply_provider_payload(payment, provider_payload)
            if payment.status == "paid":
                self._activate_subscription(user, plan, payment)
                payment = self.billing.get_payment(payment.id)
        return serialize_payment(payment)

    def expire_payment(self, user_id: str, payment_id: str):
        payment = self.billing.get_payment(payment_id)
        if payment.user_id != user_id:
            raise NotFoundError("Pagamento nao encontrado.")
        if payment.payment_method != "pix":
            return serialize_payment(payment)
        if payment.status in {"paid", "failed", "expired", "canceled", "cancelled", "refunded", "charged_back"}:
            return serialize_payment(payment)
        if payment.status not in {"pending", "processing"}:
            return serialize_payment(payment)
        provider_payload = dict(payment.provider_payload or {})
        provider_payload["status"] = "expired"
        provider_payload["expired_at"] = format_utc_millis_z(datetime.now(timezone.utc))
        updated = self.billing.update_payment(payment.id, {
            "status": "expired",
            "provider_payload": provider_payload,
            "updated_at": utcnow_naive(),
        })
        return serialize_payment(updated)

    def get_payment(self, user_id: str, payment_id: str):
        payment = self.billing.get_payment(payment_id)
        if payment.user_id != user_id:
            raise NotFoundError("Pagamento nao encontrado.")
        if not self._use_mock_mode() and payment.provider == "mercadopago" and payment.provider_payment_id and payment.status in {"pending", "processing"}:
            provider_payload = self.provider.get_payment(payment.provider_payment_id)
            payment = self._apply_provider_payload(payment, provider_payload)
            if payment.status == "paid" and not payment.subscription_id:
                user = self.users.get(payment.user_id)
                plan = self.billing.get_plan_by_code(payment.plan.code) if getattr(payment, "plan", None) else None
                if plan:
                    self._activate_subscription(user, plan, payment)
                    payment = self.billing.get_payment(payment.id)
        return serialize_payment(payment)

    def process_webhook(self, payload: dict):
        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        provider_payment_id = str(data.get("id") or payload.get("payment_id") or payload.get("provider_payment_id") or "")
        event_type = str(payload.get("type") or payload.get("action") or payload.get("topic") or "unknown")
        provider_event_id = str(payload.get("id") or payload.get("event_id") or "")
        if not provider_event_id:
            provider_event_id = f"{event_type}-{provider_payment_id}" if provider_payment_id else str(uuid4())
        if self.billing.get_event("mercadopago", provider_event_id):
            return {"processed": False, "reason": "duplicate"}

        payment = self.billing.get_payment_by_provider_id(provider_payment_id) if provider_payment_id else None
        if payment and not self._use_mock_mode():
            previous = payment.status
            provider_payload = self.provider.get_payment(provider_payment_id)
            payment = self._apply_provider_payload(payment, provider_payload)
            logger.info("mercadopago.webhook.payment_transition payment_id=%s provider_payment_id=%s %s->%s", payment.id, provider_payment_id, previous, payment.status)
            if payment.status == "paid" and not payment.subscription_id:
                user = self.users.get(payment.user_id)
                if payment.plan:
                    self._activate_subscription(user, payment.plan, payment)
                    payment = self.billing.get_payment(payment.id)

        event = self.billing.create_event({
            "payment_id": payment.id if payment else None,
            "provider": "mercadopago",
            "event_type": event_type,
            "provider_event_id": provider_event_id,
            "payload_json": safe_provider_payload(payload),
            "processed": True,
        })
        return {"processed": True, "event_id": event.id, "payment_id": payment.id if payment else None, "status": payment.status if payment else None}

    def _create_pending_payment(self, user, plan, method: str):
        expires_at = payment_expires_at() if method == "pix" else None
        return self.billing.create_payment({
            "user_id": user.id,
            "plan_id": plan.id,
            "provider": "mercadopago",
            "payment_method": method,
            "status": "pending",
            "amount_cents": plan.price_cents,
            "currency": plan.currency,
            "description": f"DinCon - Plano {plan.name}",
            "external_reference": f"dincon:{user.id}:{plan.code}:{uuid4()}",
            "provider_payload": {},
            "sandbox": not self.settings.is_production,
            "expires_at": expires_at,
        })

    def _mercadopago_payload(self, user, plan, payment, payment_method_id: str, **kwargs):
        payload = {
            "transaction_amount": round(plan.price_cents / 100, 2),
            "description": payment.description,
            "payment_method_id": payment_method_id,
            "external_reference": payment.external_reference,
            "statement_descriptor": self.settings.payments_default_statement_descriptor[:22],
            "payer": {
                "email": user.email or f"{user.id}@dincon.local",
                "first_name": user.name,
            },
        }
        notification_url = self.provider.build_notification_url()
        if notification_url:
            payload["notification_url"] = notification_url
        if payment_method_id == "pix" and payment.expires_at:
            payload["date_of_expiration"] = format_utc_millis_z(payment.expires_at)
        if kwargs.get("token"):
            payload["token"] = kwargs["token"]
            payload["installments"] = kwargs.get("installments") or 1
            if kwargs.get("issuer_id"):
                payload["issuer_id"] = kwargs["issuer_id"]
            if kwargs.get("payer_identification_type") and kwargs.get("payer_identification_number"):
                payload["payer"]["identification"] = {
                    "type": kwargs["payer_identification_type"],
                    "number": self._digits_only(kwargs["payer_identification_number"]),
                }
            elif kwargs.get("payer_identification_number"):
                payload["payer"]["identification"] = {
                    "type": "CPF",
                    "number": self._digits_only(kwargs["payer_identification_number"]),
                }
            address = self._sanitize_address(kwargs.get("address"))
            if address:
                payload["payer"]["address"] = address
        return payload

    def _apply_provider_payload(self, payment, payload: dict):
        status = map_provider_status(payload.get("status"))
        transaction = payload.get("point_of_interaction", {}).get("transaction_data", {})
        data = {
            "provider_payment_id": str(payload.get("id")) if payload.get("id") else payment.provider_payment_id,
            "status": status,
            "qr_code": transaction.get("qr_code") or payment.qr_code,
            "qr_code_base64": transaction.get("qr_code_base64") or payment.qr_code_base64,
            "checkout_url": transaction.get("ticket_url") or payload.get("init_point") or payment.checkout_url,
            "provider_payload": safe_provider_payload(payload),
            "paid_at": utcnow_naive() if status == "paid" and not payment.paid_at else payment.paid_at,
            "updated_at": utcnow_naive(),
        }
        return self.billing.update_payment(payment.id, data)

    def _activate_subscription(self, user, plan, payment):
        subscription = self.billing.create_subscription({
            "user_id": user.id,
            "plan_id": plan.id,
            "status": "active",
            "provider": payment.provider,
            "provider_subscription_id": payment.provider_payment_id,
            "current_period_start": utcnow_naive(),
            "current_period_end": period_end(),
            "cancel_at_period_end": False,
        })
        self.billing.update_payment(payment.id, {"subscription_id": subscription.id})

    def _use_mock_mode(self) -> bool:
        return bool(self.settings.payments_mock_mode and not self.settings.is_production)

    def _sanitize_address(self, address):
        if not address:
            return None

        def clean_text(value):
            if value is None:
                return None
            value = str(value).strip()
            return value or None

        def digits(value):
            if value is None:
                return None
            cleaned = "".join(ch for ch in str(value) if ch.isdigit())
            return cleaned or None

        cleaned = {
            "zip_code": digits(getattr(address, "zip_code", None)),
            "street_name": clean_text(getattr(address, "street_name", None)),
            "street_number": clean_text(getattr(address, "street_number", None)),
            "neighborhood": clean_text(getattr(address, "neighborhood", None)),
            "city": clean_text(getattr(address, "city", None)),
            "federal_unit": clean_text(getattr(address, "federal_unit", None)),
            "complement": clean_text(getattr(address, "complement", None)),
        }
        if cleaned["federal_unit"]:
            cleaned["federal_unit"] = cleaned["federal_unit"].upper()[:2]
        if not any(cleaned.values()):
            return None
        return {key: value for key, value in cleaned.items() if value}

    def _digits_only(self, value):
        if value is None:
            return None
        cleaned = "".join(ch for ch in str(value) if ch.isdigit())
        return cleaned or None
