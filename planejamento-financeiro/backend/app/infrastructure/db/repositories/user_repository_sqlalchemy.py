from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import BudgetModel, TransactionModel, UserAddressModel, UserModel


class SqlAlchemyUserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> UserModel:
        user = self.db.get(UserModel, user_id)
        if not user:
            raise NotFoundError("Usuario nao encontrado.")
        return user

    def get_by_email(self, email: str) -> UserModel:
        normalized = email.strip().lower()
        user = self.db.scalar(select(UserModel).where(func.lower(UserModel.email) == normalized))
        if not user:
            raise NotFoundError("Usuario nao encontrado.")
        return user

    def create(self, data: dict) -> UserModel:
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

    def get_address(self, user_id: str) -> UserAddressModel | None:
        return self.db.scalar(select(UserAddressModel).where(UserAddressModel.user_id == user_id))

    def upsert_address(self, user_id: str, data: dict) -> UserAddressModel:
        address = self.get_address(user_id)
        if not address:
            address = UserAddressModel(user_id=user_id, **data)
            self.db.add(address)
        else:
            for key, value in data.items():
                setattr(address, key, value)
        self.db.commit()
        self.db.refresh(address)
        return address

    def stats(self, user_id: str) -> dict:
        budget_count = self.db.scalar(select(func.count()).select_from(BudgetModel).where(BudgetModel.user_id == user_id)) or 0
        transaction_count = self.db.scalar(select(func.count()).select_from(TransactionModel).where(TransactionModel.user_id == user_id)) or 0
        database_connected = bool(self.db.execute(text("SELECT 1")).scalar())
        return {
            "budget_count": budget_count,
            "transaction_count": transaction_count,
            "database_connected": database_connected,
        }
