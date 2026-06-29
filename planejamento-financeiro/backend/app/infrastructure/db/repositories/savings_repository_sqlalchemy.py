from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import SavingsInvestmentModel


class SqlAlchemySavingsInvestmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_user(self, user_id: str):
        stmt = (
            select(SavingsInvestmentModel)
            .where(SavingsInvestmentModel.user_id == user_id, SavingsInvestmentModel.active.is_(True))
            .order_by(SavingsInvestmentModel.start_month.desc(), SavingsInvestmentModel.name)
        )
        return list(self.db.scalars(stmt))

    def get(self, investment_id: str) -> SavingsInvestmentModel:
        investment = self.db.get(SavingsInvestmentModel, investment_id)
        if not investment:
            raise NotFoundError("Investimento nao encontrado.")
        return investment

    def create(self, data: dict) -> SavingsInvestmentModel:
        investment = SavingsInvestmentModel(**data)
        self.db.add(investment)
        self.db.commit()
        self.db.refresh(investment)
        return investment

    def update(self, investment_id: str, data: dict) -> SavingsInvestmentModel:
        investment = self.get(investment_id)
        for key, value in data.items():
            setattr(investment, key, value)
        self.db.commit()
        self.db.refresh(investment)
        return investment

    def deactivate(self, investment_id: str) -> None:
        investment = self.get(investment_id)
        investment.active = False
        self.db.commit()
