import re
import unittest
from dataclasses import replace
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from app.application.billing.use_cases import BillingUseCases, format_utc_millis_z
from app.domain.billing.entities import Payment, Plan


PIX_EXPIRATION_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")


class FakeUsersRepo:
    def __init__(self, user):
        self.user = user

    def get(self, user_id: str):
        if user_id != self.user.id:
            raise LookupError(user_id)
        return self.user


class FakeBillingRepo:
    def __init__(self, plan: Plan, payment: Payment):
        self.plan = plan
        self.payment = payment
        self.updated_payloads = []

    def get_plan_by_code(self, code: str):
        if code != self.plan.code:
            raise LookupError(code)
        return self.plan

    def create_payment(self, data: dict):
        self.payment = replace(self.payment, **data, id=self.payment.id)
        return self.payment

    def get_payment(self, payment_id: str):
        if payment_id != self.payment.id:
            raise LookupError(payment_id)
        return self.payment

    def update_payment(self, payment_id: str, data: dict):
        self.updated_payloads.append(data)
        self.payment = replace(self.payment, **data)
        return self.payment

    def create_subscription(self, data: dict):
        return SimpleNamespace(id="sub_1", **data)


class FakeMercadoPagoProvider:
    def __init__(self, status: str = "pending", status_detail: str | None = None):
        self.calls = 0
        self.payloads = []
        self.status = status
        self.status_detail = status_detail

    def build_notification_url(self):
        return None

    def create_payment(self, payload: dict):
        self.calls += 1
        self.payloads.append(payload)
        return {
            "id": "mp_123",
            "status": self.status,
            "init_point": "https://example.com/checkout",
            "point_of_interaction": {
                "transaction_data": {
                    "qr_code": "000201010212...",
                    "qr_code_base64": "base64-qr",
                    "ticket_url": "https://example.com/ticket",
                }
            },
        }

    def get_payment(self, provider_payment_id: str):
        self.calls += 1
        payload = {"id": provider_payment_id, "status": self.status}
        if self.status_detail:
            payload["status_detail"] = self.status_detail
        return payload


class MercadoPagoBillingTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(id="user_1", email="user@example.com", name="Usuario")
        self.plan = Plan(
            id="plan_1",
            code="pro",
            name="Pro",
            description="Plano Pro",
            price_cents=2990,
            currency="BRL",
            billing_interval="monthly",
            is_active=True,
            features=[],
            created_at=datetime(2026, 1, 1, 0, 0, 0),
            updated_at=datetime(2026, 1, 1, 0, 0, 0),
        )

    def make_payment(self, method: str = "pix", status: str = "pending"):
        return Payment(
            id="pay_1",
            user_id=self.user.id,
            plan_id=self.plan.id,
            subscription_id=None,
            provider="mercadopago",
            provider_payment_id=None,
            payment_method=method,
            status=status,
            amount_cents=self.plan.price_cents,
            currency=self.plan.currency,
            description="DinCon - Plano Pro",
            qr_code=None,
            qr_code_base64=None,
            checkout_url=None,
            external_reference="dincon:user_1:pro:uuid",
            provider_payload={},
            sandbox=True,
            paid_at=None,
            expires_at=datetime(2026, 7, 1, 2, 6, 3),
            created_at=datetime(2026, 7, 1, 1, 36, 3),
            updated_at=datetime(2026, 7, 1, 1, 36, 3),
        )

    def make_use_cases(self, payment: Payment, provider: FakeMercadoPagoProvider):
        billing = FakeBillingRepo(self.plan, payment)
        users = FakeUsersRepo(self.user)
        settings = SimpleNamespace(
            payments_mock_mode=False,
            is_production=False,
            payments_default_statement_descriptor="DINCON",
            app_public_url="",
            api_public_url="https://api.example.com",
        )
        return BillingUseCases(billing, users, provider, settings), billing

    def test_pix_checkout_returns_expiration_and_uses_three_minutes(self):
        provider = FakeMercadoPagoProvider()
        use_cases, _ = self.make_use_cases(self.make_payment(), provider)

        with patch("app.application.billing.use_cases.payment_expires_at", return_value=datetime(2026, 7, 1, 2, 6, 3)):
            result = use_cases.create_pix_checkout(self.user.id, self.plan.code)

        self.assertEqual(provider.calls, 1)
        self.assertEqual(result["expires_in_seconds"], 180)
        self.assertEqual(result["date_of_expiration"], "2026-07-01T02:06:03.000Z")
        self.assertRegex(result["date_of_expiration"], PIX_EXPIRATION_PATTERN)

    def test_pix_expiration_uses_utc_iso8601_with_millis_and_z(self):
        self.assertEqual(format_utc_millis_z(self.make_payment().expires_at), "2026-07-01T02:06:03.000Z")

    def test_expire_payment_marks_pending_pix_as_expired(self):
        provider = FakeMercadoPagoProvider()
        payment = self.make_payment(status="pending")
        payment.provider_payment_id = "mp_123"
        use_cases, billing = self.make_use_cases(payment, provider)

        result = use_cases.expire_payment(self.user.id, payment.id)

        self.assertEqual(result["status"], "expired")
        self.assertEqual(billing.payment.status, "expired")
        self.assertEqual(billing.updated_payloads[-1]["status"], "expired")
        self.assertEqual(billing.updated_payloads[-1]["provider_payload"]["status"], "expired")

    def test_expire_payment_does_not_change_paid_payment(self):
        provider = FakeMercadoPagoProvider()
        payment = self.make_payment(status="paid")
        use_cases, billing = self.make_use_cases(payment, provider)

        result = use_cases.expire_payment(self.user.id, payment.id)

        self.assertEqual(result["status"], "paid")
        self.assertEqual(billing.payment.status, "paid")
        self.assertEqual(billing.updated_payloads, [])

    def test_card_checkout_sends_optional_address_when_present(self):
        provider = FakeMercadoPagoProvider(status="approved")
        payment = self.make_payment(method="card")
        use_cases, _ = self.make_use_cases(payment, provider)
        payload = SimpleNamespace(
            user_id=self.user.id,
            plan_code=self.plan.code,
            email="buyer@example.com",
            first_name="Maria",
            last_name="Silva",
            cpf="123.456.789-00",
            card_token="card_token_123",
            token=None,
            installments=1,
            payment_method_id="visa",
            issuer_id=None,
            payer_identification_type="CPF",
            payer_identification_number="123.456.789-00",
            address=SimpleNamespace(
                zip_code="00000-000",
                street_name="Rua das Flores",
                street_number="S/N",
                neighborhood="Centro",
                city="Sao Paulo",
                federal_unit="sp",
                complement="Apto 12",
            ),
            billing_address=SimpleNamespace(
                zip_code="00000-000",
                street_name="Rua das Flores",
                street_number="S/N",
                neighborhood="Centro",
                city="Sao Paulo",
                federal_unit="sp",
                complement="Apto 12",
            ),
            mock=False,
        )

        result = use_cases.create_card_checkout(payload)

        self.assertEqual(provider.calls, 1)
        sent_payload = provider.payloads[0]
        self.assertEqual(sent_payload["payer"]["email"], "buyer@example.com")
        self.assertEqual(sent_payload["payer"]["first_name"], "Maria")
        self.assertEqual(sent_payload["payer"]["last_name"], "Silva")
        self.assertEqual(sent_payload["payer"]["identification"]["type"], "CPF")
        self.assertEqual(sent_payload["payer"]["identification"]["number"], "12345678900")
        self.assertEqual(sent_payload["payer"]["address"]["zip_code"], "00000000")
        self.assertEqual(sent_payload["payer"]["address"]["federal_unit"], "SP")
        self.assertIn("additional_info", sent_payload)
        self.assertEqual(sent_payload["additional_info"]["items"][0]["id"], self.plan.id)
        self.assertEqual(sent_payload["additional_info"]["payer"]["first_name"], "Maria")
        self.assertEqual(result["status"], "paid")

    def test_card_checkout_without_address_still_works(self):
        provider = FakeMercadoPagoProvider(status="approved")
        payment = self.make_payment(method="card")
        use_cases, _ = self.make_use_cases(payment, provider)
        payload = SimpleNamespace(
            user_id=self.user.id,
            plan_code=self.plan.code,
            card_token="card_token_123",
            token=None,
            installments=1,
            payment_method_id="visa",
            issuer_id=None,
            payer_identification_type="CPF",
            payer_identification_number="12345678900",
            address=None,
            mock=False,
        )

        result = use_cases.create_card_checkout(payload)

        self.assertEqual(provider.calls, 1)
        sent_payload = provider.payloads[0]
        self.assertNotIn("address", sent_payload["payer"])
        self.assertEqual(result["status"], "paid")

    def test_get_payment_syncs_in_process_status_and_status_detail(self):
        provider = FakeMercadoPagoProvider(status="in_process", status_detail="pending_review_manual")
        payment = self.make_payment(method="card", status="processing")
        payment.provider_payment_id = "mp_123"
        use_cases, billing = self.make_use_cases(payment, provider)

        result = use_cases.get_payment(self.user.id, payment.id)

        self.assertEqual(provider.calls, 1)
        self.assertEqual(result["status"], "processing")
        self.assertEqual(result["status_detail"], "pending_review_manual")
        self.assertEqual(billing.payment.status, "processing")
        self.assertEqual(billing.payment.provider_payload["status_detail"], "pending_review_manual")

    def test_expired_pix_is_marked_as_expired_when_loaded(self):
        provider = FakeMercadoPagoProvider(status="pending")
        payment = self.make_payment(method="pix", status="pending")
        payment.expires_at = datetime(2026, 1, 1, 0, 0, 0)
        payment.created_at = datetime(2025, 12, 31, 23, 57, 0)
        payment.updated_at = datetime(2025, 12, 31, 23, 57, 0)
        use_cases, billing = self.make_use_cases(payment, provider)

        result = use_cases.get_payment(self.user.id, payment.id)

        self.assertEqual(result["status"], "expired")
        self.assertEqual(billing.payment.status, "expired")
        self.assertEqual(billing.payment.provider_payload["status"], "expired")


if __name__ == "__main__":
    unittest.main()
