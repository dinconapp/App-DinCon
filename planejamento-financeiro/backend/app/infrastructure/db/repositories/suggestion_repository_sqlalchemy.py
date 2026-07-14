from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.infrastructure.db.models import SuggestionModel


class SqlAlchemySuggestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_user(self, user_id: str):
        stmt = select(SuggestionModel).where(SuggestionModel.user_id == user_id).order_by(SuggestionModel.created_at.desc())
        return list(self.db.scalars(stmt))

    def get(self, suggestion_id: str) -> SuggestionModel:
        suggestion = self.db.get(SuggestionModel, suggestion_id)
        if not suggestion:
            raise NotFoundError("Sugestao nao encontrada.")
        return suggestion

    def create(self, data: dict) -> SuggestionModel:
        suggestion = SuggestionModel(**data)
        self.db.add(suggestion)
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion
