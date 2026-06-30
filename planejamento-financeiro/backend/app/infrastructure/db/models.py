import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Index, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def uuid_str() -> str:
    return str(uuid.uuid4())


def app_enum(*values: str) -> Enum:
    return Enum(*values, native_enum=False)


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180))
    phone: Mapped[str | None] = mapped_column(String(30))
    password_hash: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_status: Mapped[str] = mapped_column(app_enum("not_started", "pending", "approved", "failed", "expired", "canceled"), nullable=False, default="not_started")
    verification_started_at: Mapped[datetime | None] = mapped_column(DateTime)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    initial: Mapped[str] = mapped_column(String(5), nullable=False)
    initial_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    base_month: Mapped[str] = mapped_column(String(7), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    budgets = relationship("BudgetModel", back_populates="user")
    transactions = relationship("TransactionModel", back_populates="user")


class EmailVerificationAttemptModel(Base):
    __tablename__ = "email_verification_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(30))
    provider: Mapped[str] = mapped_column(String(30), nullable=False, default="twilio")
    provider_service_sid: Mapped[str | None] = mapped_column(String(120))
    provider_verification_sid: Mapped[str | None] = mapped_column(String(120))
    channel: Mapped[str] = mapped_column(app_enum("email", "whatsapp", "sms"), nullable=False, default="email")
    status: Mapped[str] = mapped_column(app_enum("pending", "approved", "failed", "expired", "canceled"), nullable=False, default="pending")
    error_code: Mapped[str | None] = mapped_column(String(80))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")

    __table_args__ = (
        Index("idx_email_verify_user_status", "user_id", "status"),
        Index("idx_email_verify_email_status", "email", "status"),
    )


class CategoryModel(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[str] = mapped_column(app_enum("income", "expense"), nullable=False)
    icon_key: Mapped[str | None] = mapped_column(String(80))
    color: Mapped[str | None] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BudgetModel(Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String(180), nullable=False)
    kind: Mapped[str] = mapped_column(app_enum("income", "expense"), nullable=False)
    budget_type: Mapped[str] = mapped_column(app_enum("fixed", "variable"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_month: Mapped[str | None] = mapped_column(String(7))
    end_month: Mapped[str | None] = mapped_column(String(7))
    has_due_date: Mapped[bool] = mapped_column(Boolean, default=False)
    due_day: Mapped[int | None] = mapped_column()
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel", back_populates="budgets")
    category = relationship("CategoryModel")
    transactions = relationship("TransactionModel", back_populates="budget")

    __table_args__ = (
        Index("ix_budgets_user_kind", "user_id", "kind"),
        Index("ix_budgets_user_budget_type", "user_id", "budget_type"),
        Index("ix_budgets_user_months", "user_id", "start_month", "end_month"),
    )


class TransactionModel(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    budget_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("budgets.id"))
    category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"))
    kind: Mapped[str] = mapped_column(app_enum("income", "expense"), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(app_enum("paid", "pending", "canceled"), default="paid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel", back_populates="transactions")
    budget = relationship("BudgetModel", back_populates="transactions")
    category = relationship("CategoryModel")

    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_kind", "user_id", "kind"),
        Index("ix_transactions_category", "category_id"),
    )


class WhatsAppAccountModel(Base):
    __tablename__ = "whatsapp_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False, default="twilio")
    provider_identity: Mapped[str | None] = mapped_column(String(120))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")

    __table_args__ = (
        UniqueConstraint("phone_number", "provider", name="uk_whatsapp_accounts_phone_provider"),
    )


class WhatsAppMessageModel(Base):
    __tablename__ = "whatsapp_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    whatsapp_account_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("whatsapp_accounts.id"))
    provider: Mapped[str] = mapped_column(String(30), nullable=False, default="twilio")
    provider_message_id: Mapped[str | None] = mapped_column(String(120))
    direction: Mapped[str] = mapped_column(app_enum("inbound", "outbound"), nullable=False)
    message_type: Mapped[str] = mapped_column(app_enum("text", "audio", "image", "unknown"), nullable=False)
    from_number: Mapped[str] = mapped_column(String(30), nullable=False)
    to_number: Mapped[str] = mapped_column(String(30), nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    media_url: Mapped[str | None] = mapped_column(Text)
    media_content_type: Mapped[str | None] = mapped_column(String(120))
    transcription: Mapped[str | None] = mapped_column(Text)
    raw_payload: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("UserModel")
    whatsapp_account = relationship("WhatsAppAccountModel")

    __table_args__ = (
        Index("idx_whatsapp_messages_user_created", "user_id", "created_at"),
        Index("idx_whatsapp_messages_provider_message", "provider_message_id"),
    )


class WhatsAppTransactionDraftModel(Base):
    __tablename__ = "whatsapp_transaction_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    whatsapp_message_id: Mapped[str] = mapped_column(String(36), ForeignKey("whatsapp_messages.id"), nullable=False)
    status: Mapped[str] = mapped_column(app_enum("pending_confirmation", "confirmed", "rejected", "expired", "needs_correction"), nullable=False, default="pending_confirmation")
    kind: Mapped[str] = mapped_column(app_enum("income", "expense"), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"))
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    ai_explanation: Mapped[str | None] = mapped_column(Text)
    original_text: Mapped[str | None] = mapped_column(Text)
    created_transaction_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("transactions.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")
    whatsapp_message = relationship("WhatsAppMessageModel")
    category = relationship("CategoryModel")
    created_transaction = relationship("TransactionModel")

    __table_args__ = (
        Index("idx_whatsapp_drafts_user_status", "user_id", "status"),
        Index("idx_whatsapp_drafts_message", "whatsapp_message_id"),
    )


class SavingsInvestmentModel(Base):
    __tablename__ = "savings_investments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    initial_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    monthly_contribution: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    interest_type: Mapped[str] = mapped_column(app_enum("simple", "compound", "none"), nullable=False, default="compound")
    interest_rate: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False, default=0)
    interest_period: Mapped[str] = mapped_column(app_enum("monthly", "yearly"), nullable=False, default="monthly")
    start_month: Mapped[str] = mapped_column(String(7), nullable=False)
    end_month: Mapped[str | None] = mapped_column(String(7))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")

    __table_args__ = (
        Index("idx_savings_user_active", "user_id", "active"),
        Index("idx_savings_user_start", "user_id", "start_month"),
    )


class PlanModel(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    code: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="BRL")
    billing_interval: Mapped[str] = mapped_column(String(30), nullable=False, default="month")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    features: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_plans_code", "code"),
        Index("idx_plans_is_active", "is_active"),
    )


class SubscriptionModel(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("plans.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="inactive")
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="mercadopago")
    provider_subscription_id: Mapped[str | None] = mapped_column(String(180))
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")
    plan = relationship("PlanModel")

    __table_args__ = (
        Index("idx_subscriptions_user_id", "user_id"),
        Index("idx_subscriptions_status", "status"),
        Index("idx_subscriptions_provider_subscription_id", "provider_subscription_id"),
    )


class PaymentModel(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("plans.id"))
    subscription_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("subscriptions.id"))
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="mercadopago")
    provider_payment_id: Mapped[str | None] = mapped_column(String(180))
    payment_method: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="pending")
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="BRL")
    description: Mapped[str | None] = mapped_column(Text)
    qr_code: Mapped[str | None] = mapped_column(Text)
    qr_code_base64: Mapped[str | None] = mapped_column(Text)
    checkout_url: Mapped[str | None] = mapped_column(Text)
    external_reference: Mapped[str | None] = mapped_column(String(180))
    provider_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sandbox: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel")
    plan = relationship("PlanModel")
    subscription = relationship("SubscriptionModel")

    __table_args__ = (
        Index("idx_payments_user_id", "user_id"),
        Index("idx_payments_provider_payment_id", "provider_payment_id"),
        Index("idx_payments_status", "status"),
        Index("idx_payments_external_reference", "external_reference"),
    )


class PaymentEventModel(Base):
    __tablename__ = "payment_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    payment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("payments.id"))
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="mercadopago")
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    provider_event_id: Mapped[str | None] = mapped_column(String(180))
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    payment = relationship("PaymentModel")

    __table_args__ = (
        UniqueConstraint("provider", "provider_event_id", name="uq_payment_events_provider_event"),
        Index("idx_payment_events_payment_id", "payment_id"),
        Index("idx_payment_events_provider_event_id", "provider_event_id"),
    )
