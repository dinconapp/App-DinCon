import logging
import re
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
        "whatsapp_enabled": plan.code == "pro",
    }


def serialize_payment(payment):
    provider_payload = payment.provider_payload if isinstance(payment.provider_payload, dict) else {}
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "plan_id": payment.plan_id,
        "subscription_id": payment.subscription_id,
        "provider": payment.provider,
        "provider_payment_id": payment.provider_payment_id,
        "provider_payload": provider_payload,
        "status_detail": provider_payload.get("status_detail") or provider_payload.get("status_reason") or provider_payload.get("detail"),
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
        "updated_at": dt(payment.updated_at),
    }


def serialize_business_payment(payment):
    return {
        "id": payment.id,
        "plan_name": payment.plan.name if getattr(payment, "plan", None) else "Plano",
        "amount_cents": payment.amount_cents,
        "payment_method": payment.payment_method,
        "payment_method_label": "Pix" if payment.payment_method == "pix" else "Cartão",
        "approved_at": dt(payment.paid_at),
        "valid_until": dt(payment.subscription.current_period_end) if getattr(payment, "subscription", None) else None,
        "status": "approved",
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


def serialize_business_subscription(subscription):
    if not subscription:
        return None
    return {
        "id": subscription.id,
        "plan_id": subscription.plan_id,
        "plan_code": subscription.plan.code if getattr(subscription, "plan", None) else None,
        "plan_name": subscription.plan.name if getattr(subscription, "plan", None) else None,
        "status": subscription.status,
        "current_period_start": dt(subscription.current_period_start),
        "current_period_end": dt(subscription.current_period_end),
        "valid_until": dt(subscription.current_period_end),
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
        self._expire_overdue_pix_payments(user_id)
        subscription = self._current_subscription(user_id)
        current_plan = subscription.plan if subscription and getattr(subscription, "plan", None) else self.billing.get_plan_by_code("free")
        approved_payments = [serialize_business_payment(payment) for payment in self.billing.list_approved_payments_by_user(user_id)]
        return {
            "current_plan": serialize_plan(current_plan),
            "plan_name": current_plan.name,
            "has_active_subscription": bool(subscription),
            "whatsapp_enabled": current_plan.code == "pro",
            "valid_until": dt(subscription.current_period_end) if subscription else None,
            "can_purchase": not bool(subscription),
            "can_renew_early": bool(subscription and current_plan.code == "pro"),
            "subscription": serialize_business_subscription(subscription),
            "payments": approved_payments,
            "approved_payments": approved_payments,
        }

    def create_pix_checkout(self, user_id: str, plan_code: str, renewal: bool = False):
        user = self.users.get(user_id)
        plan = self.billing.get_plan_by_code(plan_code)
        self._assert_purchase_allowed(user_id, plan, renewal)
        self._expire_overdue_pix_payments(user_id)
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
            payment = self._apply_provider_payload(payment, provider_payload, origin="checkout_response")
        return serialize_payment(payment)

    def create_card_checkout(self, payload):
        user = self.users.get(payload.user_id)
        plan = self.billing.get_plan_by_code(payload.plan_code)
        self._assert_purchase_allowed(payload.user_id, plan, bool(getattr(payload, "renewal", False)))
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
                email=getattr(payload, "email", None),
                first_name=getattr(payload, "first_name", None),
                last_name=getattr(payload, "last_name", None),
                cpf=getattr(payload, "cpf", None),
                token=token,
                installments=payload.installments,
                issuer_id=payload.issuer_id,
                payer_identification_type=payload.payer_identification_type,
                payer_identification_number=payload.payer_identification_number,
                billing_address=getattr(payload, "billing_address", None) or getattr(payload, "address", None),
            ))
            payment = self._apply_provider_payload(payment, provider_payload, origin="checkout_response")
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
        if payment.status not in {"pending", "processing", "in_process"}:
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
        payment = self._expire_overdue_pix_payment(payment)
        if not self._use_mock_mode() and payment.provider == "mercadopago" and payment.provider_payment_id and payment.status in {"pending", "processing", "in_process"}:
            provider_payload = self.provider.get_payment(payment.provider_payment_id)
            payment = self._apply_provider_payload(payment, provider_payload, origin="polling")
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
            provider_payload = self.provider.get_payment(provider_payment_id)
            payment = self._apply_provider_payload(payment, provider_payload, origin="webhook")
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

    def _assert_purchase_allowed(self, user_id: str, plan, renewal: bool):
        if plan.code == "free":
            raise BillingError("Plano gratuito nao gera cobranca.", 400, code="free_plan_no_checkout")
        subscription = self._current_subscription(user_id)
        if subscription and not renewal:
            raise BillingError("Usuário já possui plano vigente.", 409, code="active_subscription_exists")

    def _current_subscription(self, user_id: str):
        getter = getattr(self.billing, "active_subscription_by_user", None)
        if callable(getter):
            subscription = getter(user_id)
            if subscription:
                if not subscription.current_period_end or subscription.current_period_end > utcnow_naive():
                    return subscription
        latest_getter = getattr(self.billing, "latest_subscription_by_user", None)
        latest = latest_getter(user_id) if callable(latest_getter) else None
        if not latest or latest.status != "active":
            return None
        if latest.current_period_end and latest.current_period_end <= utcnow_naive():
            return None
        return latest

    def _mercadopago_payload(self, user, plan, payment, payment_method_id: str, **kwargs):
        email = self._clean_text(kwargs.get("email")) or self._clean_text(getattr(user, "email", None)) or f"{user.id}@dincon.local"
        first_name, last_name = self._resolve_name_parts(
            kwargs.get("first_name"),
            kwargs.get("last_name"),
            getattr(user, "name", None),
        )
        cpf = self._digits_only(kwargs.get("cpf") or kwargs.get("payer_identification_number"))
        identification_type = self._clean_text(kwargs.get("payer_identification_type")) or ("CPF" if cpf else None)
        billing_address = self._sanitize_address(kwargs.get("billing_address") or kwargs.get("address"))
        phone = self._sanitize_phone(getattr(user, "phone", None))
        payload = {
            "transaction_amount": round(plan.price_cents / 100, 2),
            "description": payment.description,
            "payment_method_id": payment_method_id,
            "external_reference": payment.external_reference,
            "statement_descriptor": self.settings.payments_default_statement_descriptor[:22],
            "payer": {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            },
        }
        notification_url = self.provider.build_notification_url()
        if notification_url:
            payload["notification_url"] = notification_url
        if payment_method_id == "pix" and payment.expires_at:
            payload["date_of_expiration"] = format_utc_millis_z(payment.expires_at)
        if cpf:
            payload["payer"]["identification"] = {
                "type": identification_type or "CPF",
                "number": cpf,
            }
        if kwargs.get("token"):
            payload["token"] = kwargs["token"]
            payload["installments"] = kwargs.get("installments") or 1
            if kwargs.get("issuer_id"):
                payload["issuer_id"] = kwargs["issuer_id"]
            if billing_address:
                payload["payer"]["address"] = billing_address
            additional_info = self._build_additional_info(plan, billing_address, first_name, last_name, phone)
            if additional_info:
                payload["additional_info"] = additional_info
        elif billing_address:
            payload["payer"]["address"] = billing_address
        return payload

    def _apply_provider_payload(self, payment, payload: dict, origin: str = "provider_sync"):
        previous = payment.status
        provider_status = str(payload.get("status") or "").lower()
        provider_status_detail = str(payload.get("status_detail") or "").lower()
        status = map_provider_status(provider_status)
        if payment.payment_method == "pix":
            provider_expired = provider_status == "expired" or (provider_status in {"cancelled", "canceled"} and provider_status_detail == "expired")
        transaction = payload.get("point_of_interaction", {}).get("transaction_data", {})
        approved_at = self._parse_provider_datetime(payload.get("date_approved"))
        expiration = self._parse_provider_datetime(payload.get("date_of_expiration") or payload.get("date_of_expiration_utc"))
        is_expired_by_date = bool(expiration and expiration <= datetime.now(timezone.utc).replace(tzinfo=None))
        if payment.payment_method == "pix" and is_expired_by_date and status in {"pending", "processing", "in_process"}:
            status = "expired"
        if payment.payment_method == "pix" and not is_expired_by_date and provider_status in {"expired", "cancelled", "canceled"}:
            if provider_status_detail == "expired" or provider_expired:
                status = previous if previous in {"pending", "processing", "in_process"} else "pending"
        data = {
            "provider_payment_id": str(payload.get("id")) if payload.get("id") else payment.provider_payment_id,
            "status": status,
            "qr_code": None if status == "expired" else transaction.get("qr_code") or payment.qr_code,
            "qr_code_base64": None if status == "expired" else transaction.get("qr_code_base64") or payment.qr_code_base64,
            "checkout_url": transaction.get("ticket_url") or payload.get("init_point") or payment.checkout_url,
            "provider_payload": safe_provider_payload({
                **payload,
                "status": "pending" if payment.payment_method == "pix" and not is_expired_by_date and provider_status in {"expired", "cancelled", "canceled"} and (provider_status_detail == "expired" or provider_expired) else payload.get("status"),
                "status_detail": "pending_waiting_transfer" if payment.payment_method == "pix" and not is_expired_by_date and provider_status in {"expired", "cancelled", "canceled"} and (provider_status_detail == "expired" or provider_expired) else payload.get("status_detail"),
            }),
            "paid_at": approved_at or (utcnow_naive() if status == "paid" and not payment.paid_at else payment.paid_at),
            "updated_at": utcnow_naive(),
        }
        updated = self.billing.update_payment(payment.id, data)
        if payment.payment_method == "pix" and status == "expired":
            updated = self.billing.update_payment(updated.id, {
                "status": "expired",
                "qr_code": None,
                "qr_code_base64": None,
                "provider_payload": {
                    **(updated.provider_payload or {}),
                    "status": "expired",
                    "expired_at": format_utc_millis_z(datetime.now(timezone.utc)),
                },
                "updated_at": utcnow_naive(),
            })
        self._log_payment_transition(updated, previous, status, origin)
        return updated

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

    def _expire_overdue_pix_payments(self, user_id: str):
        list_payments = getattr(self.billing, "list_payments_by_user", None)
        if not callable(list_payments):
            return
        payments = list_payments(user_id)
        for payment in payments:
            self._expire_overdue_pix_payment(payment)

    def _expire_overdue_pix_payment(self, payment):
        if payment.payment_method != "pix":
            return payment
        if payment.status not in {"pending", "processing", "in_process"}:
            return payment
        if not payment.expires_at:
            return payment
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if now < payment.expires_at:
            return payment
        provider_payload = dict(payment.provider_payload or {})
        provider_payload["status"] = "expired"
        provider_payload["expired_at"] = format_utc_millis_z(datetime.now(timezone.utc))
        updated = self.billing.update_payment(payment.id, {
            "status": "expired",
            "provider_payload": provider_payload,
            "updated_at": utcnow_naive(),
        })
        self._log_payment_transition(updated, payment.status, "expired", "auto_expire")
        return updated

    def _clean_text(self, value):
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    def _resolve_name_parts(self, first_name, last_name, fallback_name):
        explicit_first = self._clean_text(first_name)
        explicit_last = self._clean_text(last_name)
        if explicit_first and explicit_last:
            return explicit_first, explicit_last
        if explicit_first and not explicit_last:
            return explicit_first, None
        cleaned = self._clean_text(fallback_name) or ""
        parts = [part for part in re.split(r"\s+", cleaned) if part]
        if not parts:
            return "Cliente", None
        if len(parts) == 1:
            return parts[0], None
        return parts[0], " ".join(parts[1:])

    def _sanitize_address(self, address):
        if not address:
            return None

        def digits(value):
            if value is None:
                return None
            cleaned = "".join(ch for ch in str(value) if ch.isdigit())
            return cleaned or None

        cleaned = {
            "zip_code": digits(getattr(address, "zip_code", None)),
            "street_name": self._clean_text(getattr(address, "street_name", None)),
            "street_number": self._clean_text(getattr(address, "street_number", None)),
            "neighborhood": self._clean_text(getattr(address, "neighborhood", None)),
            "city": self._clean_text(getattr(address, "city", None)),
            "federal_unit": self._clean_text(getattr(address, "federal_unit", None)),
            "complement": self._clean_text(getattr(address, "complement", None)),
        }
        if cleaned["federal_unit"]:
            cleaned["federal_unit"] = cleaned["federal_unit"].upper()[:2]
        if not any(cleaned.values()):
            return None
        return {key: value for key, value in cleaned.items() if value}

    def _sanitize_phone(self, phone):
        digits = self._digits_only(phone)
        if not digits:
            return None
        if len(digits) <= 2:
            return None
        area_code = digits[:2]
        number = digits[2:]
        return {
            "area_code": area_code,
            "number": number,
        }

    def _build_additional_info(self, plan, billing_address, first_name, last_name, phone):
        payer = {}
        if first_name:
            payer["first_name"] = first_name
        if last_name:
            payer["last_name"] = last_name
        if phone:
            payer["phone"] = phone
        if billing_address:
            payer_address = {}
            if billing_address.get("zip_code"):
                payer_address["zip_code"] = billing_address["zip_code"]
            if billing_address.get("street_name"):
                payer_address["street_name"] = billing_address["street_name"]
            if billing_address.get("street_number"):
                payer_address["street_number"] = billing_address["street_number"]
            if payer_address:
                payer["address"] = payer_address

        item = {
            "id": plan.id,
            "title": f"DinCon - Plano {plan.name}",
            "description": f"Assinatura do Plano {plan.name} DinCon",
            "quantity": 1,
            "unit_price": round(plan.price_cents / 100, 2),
        }
        data = {"items": [item]}
        if payer:
            data["payer"] = payer
        return data

    def _parse_provider_datetime(self, value):
        if not value:
            return None
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value
        if not isinstance(value, str):
            return None
        normalized = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            return parsed
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)

    def _digits_only(self, value):
        if value is None:
            return None
        cleaned = "".join(ch for ch in str(value) if ch.isdigit())
        return cleaned or None

    def _log_payment_transition(self, payment, old_status: str, new_status: str, origin: str):
        provider_payload = payment.provider_payload if isinstance(payment.provider_payload, dict) else {}
        status_detail = provider_payload.get("status_detail") or provider_payload.get("status_reason") or provider_payload.get("detail")
        expires_at = payment.expires_at
        if expires_at and expires_at.tzinfo is not None:
            expires_at = expires_at.astimezone(timezone.utc).replace(tzinfo=None)
        is_expired_by_date = bool(expires_at and expires_at <= datetime.now(timezone.utc).replace(tzinfo=None))
        logger.info(
            "mercadopago.payment.transition origin=%s payment_id=%s provider_payment_id=%s external_reference=%s old_status=%s new_status=%s status_detail=%s is_expired_by_date=%s",
            origin,
            payment.id,
            payment.provider_payment_id,
            payment.external_reference,
            old_status,
            new_status,
            status_detail,
            is_expired_by_date,
        )
