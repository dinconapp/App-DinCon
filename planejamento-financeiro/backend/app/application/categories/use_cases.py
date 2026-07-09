import logging

from app.application.common import model_to_dict
from app.domain.categories.services import normalize_category_name

logger = logging.getLogger(__name__)


CATEGORY_FIELDS = ["id", "name", "type", "icon_key", "color", "active"]


class CategoryUseCases:
    def __init__(self, categories):
        self.categories = categories

    def list(self, type: str | None = None, user_id: str | None = None):
        return [model_to_dict(category, CATEGORY_FIELDS) for category in self.categories.list(type, user_id)]

    def resolve_or_create_category(self, name: str | None, category_type: str, user_id: str | None = None):
        requested_name = (name or "").strip()
        if not requested_name or not normalize_category_name(requested_name):
            requested_name = "Outros"
        category = self.categories.find_by_normalized_name(requested_name, category_type, user_id)
        if category:
            return category
        category = self.categories.create({
            "user_id": user_id,
            "name": requested_name,
            "type": category_type,
            "icon_key": "circle-dollar-sign",
            "color": "#9AA3B2",
            "active": True,
        })
        logger.info("category.auto_created name=%s type=%s", category.name, category.type)
        return category
