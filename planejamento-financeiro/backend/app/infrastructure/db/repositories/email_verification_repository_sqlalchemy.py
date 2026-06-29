from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import EmailVerificationAttemptModel


class SqlAlchemyEmailVerificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> EmailVerificationAttemptModel:
        try:
            attempt = EmailVerificationAttemptModel(**data)
            self.db.add(attempt)
            self.db.commit()
            self.db.refresh(attempt)
            return attempt
        except Exception:
            self.db.rollback()
            raise

    def latest_pending(self, user_id: str) -> EmailVerificationAttemptModel | None:
        try:
            return self.db.scalar(
                select(EmailVerificationAttemptModel)
                .where(EmailVerificationAttemptModel.user_id == user_id, EmailVerificationAttemptModel.status == "pending")
                .order_by(EmailVerificationAttemptModel.created_at.desc())
            )
        except Exception:
            self.db.rollback()
            raise

    def update(self, attempt_id: str, data: dict) -> EmailVerificationAttemptModel:
        try:
            attempt = self.db.get(EmailVerificationAttemptModel, attempt_id)
            if not attempt:
                raise ValueError("Tentativa de verificacao nao encontrada.")
            for key, value in data.items():
                setattr(attempt, key, value)
            self.db.commit()
            self.db.refresh(attempt)
            return attempt
        except Exception:
            self.db.rollback()
            raise
