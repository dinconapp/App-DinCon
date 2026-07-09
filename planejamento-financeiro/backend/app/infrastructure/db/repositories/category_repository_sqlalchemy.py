from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.domain.categories.services import normalize_category_name
from app.infrastructure.db.models import CategoryModel


class SqlAlchemyCategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, type: str | None = None, user_id: str | None = None):
        stmt = select(CategoryModel).where(CategoryModel.active.is_(True))
        if user_id:
            stmt = stmt.where((CategoryModel.user_id.is_(None)) | (CategoryModel.user_id == user_id))
        if type:
            stmt = stmt.where(CategoryModel.type == type)
        stmt = stmt.order_by(CategoryModel.type, CategoryModel.user_id.is_not(None).desc(), CategoryModel.name)
        return list(self.db.scalars(stmt))

    def get(self, category_id: str) -> CategoryModel:
        category = self.db.get(CategoryModel, category_id)
        if not category:
            raise NotFoundError("Categoria nao encontrada.")
        return category

    def find_by_normalized_name(self, name: str, category_type: str, user_id: str | None = None):
        wanted = normalize_category_name(name)
        categories = self.list(category_type, user_id)
        matches = [category for category in categories if normalize_category_name(category.name) == wanted]
        if user_id:
            return next((category for category in matches if category.user_id == user_id), None)
        return next(iter(matches), None)

    def create(self, data: dict) -> CategoryModel:
        category = CategoryModel(**data)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
