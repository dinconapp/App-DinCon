from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import WhatsAppTransactionDraftModel


class SqlAlchemyWhatsAppTransactionDraftRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, user_id: str, status: str | None = None):
        stmt = select(WhatsAppTransactionDraftModel).where(WhatsAppTransactionDraftModel.user_id == user_id).order_by(WhatsAppTransactionDraftModel.created_at.desc())
        if status:
            stmt = stmt.where(WhatsAppTransactionDraftModel.status == status)
        return list(self.db.scalars(stmt))

    def get_pending_by_user(self, user_id: str):
        stmt = (
            select(WhatsAppTransactionDraftModel)
            .where(
                WhatsAppTransactionDraftModel.user_id == user_id,
                WhatsAppTransactionDraftModel.status == "pending_confirmation",
            )
            .order_by(WhatsAppTransactionDraftModel.created_at.desc())
        )
        return self.db.scalar(stmt)

    def create(self, data: dict):
        draft = WhatsAppTransactionDraftModel(**data)
        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)
        return draft

    def update(self, draft_id: str, data: dict):
        draft = self.db.get(WhatsAppTransactionDraftModel, draft_id)
        if not draft:
            raise NotFoundError("Rascunho nao encontrado.")
        for key, value in data.items():
            setattr(draft, key, value)
        self.db.commit()
        self.db.refresh(draft)
        return draft
