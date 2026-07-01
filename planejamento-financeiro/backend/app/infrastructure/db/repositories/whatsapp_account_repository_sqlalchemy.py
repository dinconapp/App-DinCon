from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.infrastructure.db.models import WhatsAppAccountModel


class SqlAlchemyWhatsAppAccountRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_user(self, user_id: str):
        stmt = select(WhatsAppAccountModel).where(WhatsAppAccountModel.user_id == user_id, WhatsAppAccountModel.active.is_(True)).order_by(WhatsAppAccountModel.created_at.desc())
        return list(self.db.scalars(stmt))

    def get(self, account_id: str):
        account = self.db.get(WhatsAppAccountModel, account_id)
        if not account:
            raise NotFoundError("Conta WhatsApp nao encontrada.")
        return account

    def get_active_by_phone(self, phone_number: str, provider: str):
        stmt = select(WhatsAppAccountModel).where(
            WhatsAppAccountModel.phone_number == phone_number,
            WhatsAppAccountModel.provider == provider,
            WhatsAppAccountModel.active.is_(True),
        )
        return self.db.scalar(stmt)

    def get_by_phone(self, phone_number: str, provider: str):
        stmt = select(WhatsAppAccountModel).where(
            WhatsAppAccountModel.phone_number == phone_number,
            WhatsAppAccountModel.provider == provider,
        )
        return self.db.scalar(stmt)

    def create(self, data: dict):
        existing = self.get_by_phone(data["phone_number"], data["provider"])
        if existing and existing.user_id != data["user_id"]:
            raise BusinessRuleError("Este WhatsApp ja esta vinculado a outro usuario.")
        if existing:
            existing.active = True
            existing.alias = data.get("alias") or existing.alias or "Principal"
            existing.provider_identity = data.get("provider_identity")
            self.db.commit()
            self.db.refresh(existing)
            return existing
        account = WhatsAppAccountModel(**data)
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def update(self, account_id: str, data: dict):
        account = self.get(account_id)
        for key, value in data.items():
            setattr(account, key, value)
        self.db.commit()
        self.db.refresh(account)
        return account

    def deactivate(self, account_id: str) -> None:
        account = self.get(account_id)
        account.active = False
        self.db.commit()
