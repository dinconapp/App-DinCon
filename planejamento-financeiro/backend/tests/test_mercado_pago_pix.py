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

    def get_plan_by_code(self, code: str):
        if code != self.plan.code:
            raise LookupError(code)
        return self.plan

    def create_payment(self, data: dict):
        self.payment = replace(self.payment, **data, id=self.payment.id)
        return self.payment

    def update_payment(self, payment_id: str, data: dict):
        self.payment = replace(self.payment, **data)
        return self.payment


class FakeMercadoPagoProvider:
    def __init__(self):
        self.calls = 0
        self.payloads = []

    def build_notification_url(self):
        return None

    def create_payment(self, payload: dict):
        self.calls += 1
        self.payloads.append(payload)
        return {
            "id": "mp_123",
            "status": "pending",
            "point_of_interaction": {"transaction_data": {}},
        }

    def get_payment(self, provider_payment_id: str):
        return {"id": provider_payment_id, "status": "pending"}


class MercadoPagoPixPayloadTests(unittest.TestCase):
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
        self.payment = Payment(
            id="pay_1",
            user_id=self.user.id,
            plan_id=self.plan.id,
            subscription_id=None,
            provider="mercadopago",
            provider_payment_id=None,
            payment_method="pix",
            status="pending",
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

    def test_pix_expiration_uses_utc_iso8601_with_millis_and_z(self):
        self.assertEqual(format_utc_millis_z(self.payment.expires_at), "2026-07-01T02:06:03.000Z")

    @patch("app.application.billing.use_cases.payment_expires_at", return_value=datetime(2026, 7, 1, 2, 6, 3))
    def test_pix_checkout_sends_date_of_expiration_with_z_and_calls_real_provider_when_mock_disabled(self, _mock_expires_at):
        provider = FakeMercadoPagoProvider()
        billing = FakeBillingRepo(self.plan, self.payment)
        users = FakeUsersRepo(self.user)
        settings = SimpleNamespace(
            payments_mock_mode=False,
            is_production=False,
            payments_default_statement_descriptor="DINCON",
            app_public_url="",
            api_public_url="https://api.example.com",
        )
        use_cases = BillingUseCases(billing, users, provider, settings)

        result = use_cases.create_pix_checkout(self.user.id, self.plan.code)

        self.assertEqual(provider.calls, 1)
        self.assertEqual(len(provider.payloads), 1)
        payload = provider.payloads[0]
        self.assertIn("date_of_expiration", payload)
        self.assertRegex(payload["date_of_expiration"], PIX_EXPIRATION_PATTERN)
        self.assertEqual(payload["date_of_expiration"], "2026-07-01T02:06:03.000Z")
        self.assertNotIn(" ", payload["date_of_expiration"])
        self.assertTrue(payload["date_of_expiration"].endswith("Z"))
        self.assertEqual(result["provider_payment_id"], "mp_123")


if __name__ == "__main__":
    unittest.main()
