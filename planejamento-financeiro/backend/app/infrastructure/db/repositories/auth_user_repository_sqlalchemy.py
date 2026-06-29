from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import UserModel


class SqlAlchemyAuthUserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> UserModel:
        user = self.db.get(UserModel, user_id)
        if not user:
            raise NotFoundError("Usuario nao encontrado.")
        return user

    def get_by_email_or_none(self, email: str) -> UserModel | None:
        normalized = email.strip().lower()
        return self.db.scalar(select(UserModel).where(func.lower(UserModel.email) == normalized))

    def create_pending(self, data: dict) -> UserModel:
        user = UserModel(**data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: str, data: dict) -> UserModel:
        user = self.get(user_id)
        for key, value in data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user
