from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.domain.billing.services import PLAN_DEFINITIONS
from app.infrastructure.db.models import PaymentEventModel, PaymentModel, PlanModel, SubscriptionModel


class SqlAlchemyBillingRepository:
    def __init__(self, db: Session):
        self.db = db

    def ensure_default_plans(self):
        rows = []
        desired_codes = {item["code"] for item in PLAN_DEFINITIONS}
        for item in PLAN_DEFINITIONS:
            plan = self.db.scalar(select(PlanModel).where(PlanModel.code == item["code"]))
            if not plan:
                plan = PlanModel(
                    code=item["code"],
                    name=item["name"],
                    description=item["description"],
                    price_cents=item["price_cents"],
                    currency="BRL",
                    billing_interval="month",
                    is_active=True,
                    features=item["features"],
                )
                self.db.add(plan)
            else:
                plan.name = item["name"]
                plan.description = item["description"]
                plan.price_cents = item["price_cents"]
                plan.features = item["features"]
                plan.is_active = True
            rows.append(plan)
        legacy_plans = list(self.db.scalars(select(PlanModel).where(~PlanModel.code.in_(desired_codes)))) if desired_codes else []
        for plan in legacy_plans:
            plan.is_active = False
        self.db.flush()
        self.db.commit()
        return rows

    def list_plans(self):
        self.ensure_default_plans()
        stmt = select(PlanModel).where(PlanModel.is_active.is_(True)).order_by(PlanModel.price_cents.asc())
        return list(self.db.scalars(stmt))

    def get_plan_by_code(self, code: str):
        self.ensure_default_plans()
        plan = self.db.scalar(select(PlanModel).where(PlanModel.code == code, PlanModel.is_active.is_(True)))
        if not plan:
            raise NotFoundError("Plano nao encontrado.")
        return plan

    def create_payment(self, data: dict):
        payment = PaymentModel(**data)
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_payment(self, payment_id: str):
        payment = self.db.get(PaymentModel, payment_id)
        if not payment:
            raise NotFoundError("Pagamento nao encontrado.")
        return payment

    def get_payment_by_provider_id(self, provider_payment_id: str):
        return self.db.scalar(select(PaymentModel).where(PaymentModel.provider_payment_id == provider_payment_id))

    def update_payment(self, payment_id: str, data: dict):
        payment = self.get_payment(payment_id)
        for key, value in data.items():
            setattr(payment, key, value)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def create_subscription(self, data: dict):
        subscription = SubscriptionModel(**data)
        self.db.add(subscription)
        self.db.flush()
        return subscription

    def latest_subscription_by_user(self, user_id: str):
        stmt = select(SubscriptionModel).where(SubscriptionModel.user_id == user_id).order_by(SubscriptionModel.created_at.desc())
        return self.db.scalar(stmt)

    def active_subscription_by_user(self, user_id: str):
        stmt = (
            select(SubscriptionModel)
            .where(SubscriptionModel.user_id == user_id, SubscriptionModel.status == "active")
            .order_by(SubscriptionModel.current_period_end.desc().nullslast(), SubscriptionModel.created_at.desc())
        )
        return self.db.scalar(stmt)

    def list_payments_by_user(self, user_id: str, limit: int = 10):
        stmt = select(PaymentModel).where(PaymentModel.user_id == user_id).order_by(PaymentModel.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def list_approved_payments_by_user(self, user_id: str, limit: int = 10):
        stmt = (
            select(PaymentModel)
            .where(PaymentModel.user_id == user_id, PaymentModel.status.in_(["paid", "approved"]))
            .order_by(PaymentModel.paid_at.desc().nullslast(), PaymentModel.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def get_event(self, provider: str, provider_event_id: str):
        return self.db.scalar(select(PaymentEventModel).where(PaymentEventModel.provider == provider, PaymentEventModel.provider_event_id == provider_event_id))

    def create_event(self, data: dict):
        event = PaymentEventModel(**data)
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event
