from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import BudgetModel, TransactionModel


class SqlAlchemyBudgetRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_user(self, user_id: str):
        stmt = (
            select(BudgetModel)
            .options(joinedload(BudgetModel.category))
            .where(BudgetModel.user_id == user_id, BudgetModel.active.is_(True))
            .order_by(BudgetModel.kind, BudgetModel.budget_type, BudgetModel.description)
        )
        return list(self.db.scalars(stmt))

    def get(self, budget_id: str) -> BudgetModel:
        stmt = select(BudgetModel).options(joinedload(BudgetModel.category)).where(BudgetModel.id == budget_id)
        budget = self.db.scalar(stmt)
        if not budget:
            raise NotFoundError("Item de planejamento nao encontrado.")
        return budget

    def create(self, data: dict) -> BudgetModel:
        budget = BudgetModel(**data)
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return self.get(budget.id)

    def update(self, budget_id: str, data: dict) -> BudgetModel:
        budget = self.get(budget_id)
        for key, value in data.items():
            setattr(budget, key, value)
        self.db.commit()
        return self.get(budget_id)

    def delete(self, budget_id: str) -> None:
        budget = self.get(budget_id)
        self.db.query(TransactionModel).filter(TransactionModel.budget_id == budget_id).delete()
        self.db.delete(budget)
        self.db.commit()
