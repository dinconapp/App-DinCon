from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.domain.categories.services import normalize_category_name
from app.infrastructure.db.models import CategoryModel


class SqlAlchemyCategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, type: str | None = None):
        stmt = select(CategoryModel).where(CategoryModel.active.is_(True)).order_by(CategoryModel.type, CategoryModel.name)
        if type:
            stmt = stmt.where(CategoryModel.type == type)
        return list(self.db.scalars(stmt))

    def get(self, category_id: str) -> CategoryModel:
        category = self.db.get(CategoryModel, category_id)
        if not category:
            raise NotFoundError("Categoria nao encontrada.")
        return category

    def find_by_normalized_name(self, name: str, category_type: str):
        wanted = normalize_category_name(name)
        categories = self.list(category_type)
        return next((category for category in categories if normalize_category_name(category.name) == wanted), None)

    def create(self, data: dict) -> CategoryModel:
        category = CategoryModel(**data)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
