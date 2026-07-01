import unittest
from datetime import datetime
from types import SimpleNamespace

from app.application.billing.use_cases import BillingUseCases
from app.application.whatsapp.use_cases import WhatsAppAccountUseCases
from app.core.exceptions import BusinessRuleError
from app.domain.billing.services import BillingError


class FakePlan:
    def __init__(self, code: str, name: str, price_cents: int = 0):
        self.id = f"plan_{code}"
        self.code = code
        self.name = name
        self.description = f"Plano {name}"
        self.price_cents = price_cents
        self.currency = "BRL"
        self.billing_interval = "month"
        self.features = []


class FakeSubscription:
    def __init__(self, plan: FakePlan):
        self.id = "sub_1"
        self.user_id = "user_1"
        self.plan_id = plan.id
        self.plan = plan
        self.status = "active"
        self.current_period_start = datetime(2026, 6, 1, 10, 0, 0)
        self.current_period_end = datetime(2026, 7, 1, 10, 0, 0)
        self.cancel_at_period_end = False


class FakePayment:
    def __init__(self, plan: FakePlan, status: str = "paid"):
        self.id = "pay_1"
        self.user_id = "user_1"
        self.plan_id = plan.id
        self.subscription_id = "sub_1"
        self.provider = "mercadopago"
        self.provider_payment_id = "mp_1"
        self.provider_payload = {}
        self.status_detail = None
        self.payment_method = "card"
        self.status = status
        self.amount_cents = plan.price_cents
        self.currency = "BRL"
        self.description = f"DinCon - Plano {plan.name}"
        self.qr_code = None
        self.qr_code_base64 = None
        self.checkout_url = None
        self.external_reference = "dincon:user_1:pro:uuid"
        self.sandbox = True
        self.date_of_expiration = None
        self.expires_in_seconds = None
        self.paid_at = datetime(2026, 7, 1, 10, 0, 0)
        self.expires_at = None
        self.created_at = datetime(2026, 6, 1, 10, 0, 0)
        self.updated_at = datetime(2026, 6, 1, 10, 0, 0)
        self.plan = plan
        self.subscription = FakeSubscription(plan)


class FakeBillingRepo:
    def __init__(self, plans, subscription=None, payments=None):
        self.plans = plans
        self.subscription = subscription
        self.payments = payments or []

    def list_plans(self):
        return self.plans

    def get_plan_by_code(self, code: str):
        for plan in self.plans:
            if plan.code == code:
                return plan
        raise LookupError(code)

    def active_subscription_by_user(self, user_id: str):
        return self.subscription if self.subscription and self.subscription.user_id == user_id else None

    def latest_subscription_by_user(self, user_id: str):
        return self.active_subscription_by_user(user_id)

    def list_approved_payments_by_user(self, user_id: str):
        return list(self.payments)

    def list_payments_by_user(self, user_id: str):
        return list(self.payments)

    def create_payment(self, data: dict):
        payment = FakePayment(self.get_plan_by_code("pro"))
        for key, value in data.items():
            setattr(payment, key, value)
        self.payments.append(payment)
        return payment

    def update_payment(self, payment_id: str, data: dict):
        payment = next((item for item in self.payments if item.id == payment_id), self.create_payment({}))
        payment.id = payment_id
        for key, value in data.items():
            setattr(payment, key, value)
        return payment

    def create_subscription(self, data: dict):
        return SimpleNamespace(id="sub_new", **data)


class FakeUsersRepo:
    def __init__(self, user):
        self.user = user

    def get(self, user_id: str):
        if user_id != self.user.id:
            raise LookupError(user_id)
        return self.user


class FakeProvider:
    def build_notification_url(self):
        return None

    def create_payment(self, payload: dict):
        return {
            "id": "mp_created",
            "status": "pending",
            "point_of_interaction": {"transaction_data": {"qr_code": "qr", "qr_code_base64": "qr64", "ticket_url": "url"}},
        }

    def get_payment(self, provider_payment_id: str):
        return {"id": provider_payment_id, "status": "pending"}


class FakeAccountsRepo:
    def __init__(self, account=None):
        self.account = account
        self.created = []

    def list_by_user(self, user_id: str):
        return [self.account] if self.account and self.account.user_id == user_id else []

    def get(self, account_id: str):
        if self.account and self.account.id == account_id:
            return self.account
        raise LookupError(account_id)

    def get_active_by_phone(self, phone_number: str, provider: str):
        return self.account if self.account and self.account.active and self.account.phone_number == phone_number else None

    def create(self, data: dict):
        self.created.append(data)
        return SimpleNamespace(
            id="acc_1",
            user_id=data["user_id"],
            phone_number=data["phone_number"],
            phone_number_e164=data.get("phone_number_e164"),
            alias=data.get("alias"),
            provider=data["provider"],
            provider_identity=None,
            active=True,
            created_at=datetime(2026, 7, 1, 10, 0, 0),
            updated_at=datetime(2026, 7, 1, 10, 0, 0),
        )

    def update(self, account_id: str, data: dict):
        for key, value in data.items():
            setattr(self.account, key, value)
        return self.account

    def deactivate(self, account_id: str):
        if self.account:
            self.account.active = False


class BillingAndWhatsAppCleanupTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(id="user_1", email="user@example.com", name="Usuario", phone="+5511999999999")
        self.free_plan = FakePlan("free", "Plano Gratuito", 0)
        self.pro_plan = FakePlan("pro", "Plano WhatsApp", 2990)

    def make_billing_use_cases(self, subscription=None, payments=None):
        repo = FakeBillingRepo([self.free_plan, self.pro_plan], subscription=subscription, payments=payments or [])
        settings = SimpleNamespace(
            payments_mock_mode=False,
            is_production=False,
            payments_default_statement_descriptor="DINCON",
            app_public_url="",
            api_public_url="https://api.example.com",
        )
        return BillingUseCases(repo, FakeUsersRepo(self.user), FakeProvider(), settings), repo

    def test_user_billing_returns_business_view_and_approved_payments_only(self):
        payment = FakePayment(self.pro_plan)
        use_cases, _ = self.make_billing_use_cases(subscription=FakeSubscription(self.pro_plan), payments=[payment])

        payload = use_cases.user_billing(self.user.id)

        self.assertEqual(payload["current_plan"]["code"], "pro")
        self.assertTrue(payload["has_active_subscription"])
        self.assertTrue(payload["whatsapp_enabled"])
        self.assertEqual(len(payload["payments"]), 1)
        self.assertEqual(payload["payments"][0]["status"], "approved")
        self.assertNotIn("provider_payment_id", payload["payments"][0])

    def test_checkout_blocks_duplicate_plan_without_explicit_renewal(self):
        use_cases, _ = self.make_billing_use_cases(subscription=FakeSubscription(self.pro_plan))

        with self.assertRaises(BillingError):
            use_cases.create_pix_checkout(self.user.id, "pro")

    def test_checkout_allows_explicit_renewal(self):
        use_cases, repo = self.make_billing_use_cases(subscription=FakeSubscription(self.pro_plan))

        result = use_cases.create_pix_checkout(self.user.id, "pro", renewal=True)

        self.assertEqual(result["status"], "pending")
        self.assertEqual(result["payment_method"], "pix")
        self.assertEqual(repo.payments[0].payment_method, "pix")

    def test_whatsapp_account_creation_requires_active_whatsapp_plan(self):
        billing_use_cases, _ = self.make_billing_use_cases(subscription=None)
        accounts = FakeAccountsRepo()
        use_cases = WhatsAppAccountUseCases(accounts, FakeUsersRepo(self.user), billing_use_cases.billing)

        with self.assertRaises(BusinessRuleError):
            use_cases.create(SimpleNamespace(user_id=self.user.id, phone_number="+55 11999999999", alias="Pai", provider="twilio"))

    def test_whatsapp_account_creation_succeeds_with_plan(self):
        billing_use_cases, _ = self.make_billing_use_cases(subscription=FakeSubscription(self.pro_plan))
        accounts = FakeAccountsRepo()
        use_cases = WhatsAppAccountUseCases(accounts, FakeUsersRepo(self.user), billing_use_cases.billing)

        result = use_cases.create(SimpleNamespace(user_id=self.user.id, phone_number="+55 11999999999", alias="Pai", provider="twilio"))

        self.assertEqual(result["alias"], "Pai")
        self.assertEqual(result["phone_number_e164"], "+5511999999999")


if __name__ == "__main__":
    unittest.main()
