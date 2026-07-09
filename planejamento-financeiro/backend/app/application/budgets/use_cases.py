from app.application.common import model_to_dict
from app.application.categories.use_cases import CategoryUseCases


BUDGET_FIELDS = [
    "id", "user_id", "description", "kind", "category_id", "budget_type", "amount",
    "start_month", "end_month", "has_due_date", "due_day", "active",
]


def serialize_budget(budget):
    return model_to_dict(budget, BUDGET_FIELDS) | {
        "category_name": budget.category.name if budget.category else None,
        "category_color": budget.category.color if budget.category else None,
        "category_icon_key": budget.category.icon_key if budget.category else None,
    }


class BudgetUseCases:
    def __init__(self, budgets, categories, transactions=None):
        self.budgets = budgets
        self.categories = categories
        self.transactions = transactions
        self.db = budgets.db

    def list(self, user_id: str):
        return [serialize_budget(budget) for budget in self.budgets.list_by_user(user_id)]

    def create(self, payload):
        category = self._resolve_category(payload, allow_none=False)
        data = payload.model_dump()
        data["category_id"] = category.id
        data.pop("category_name", None)
        if data["budget_type"] == "fixed":
            data["end_month"] = None
        return serialize_budget(self.budgets.create(data))

    def update(self, budget_id: str, payload):
        category = self._resolve_category(payload, allow_none=False)
        data = payload.model_dump()
        data["category_id"] = category.id
        data.pop("category_name", None)
        if data["budget_type"] == "fixed":
            data["end_month"] = None
        return serialize_budget(self.budgets.update(budget_id, data))

    def _resolve_category(self, payload, allow_none: bool):
        category = None
        if payload.category_id:
            category = self.categories.get(payload.category_id)
        elif payload.category_name:
            category = CategoryUseCases(self.categories).resolve_or_create_category(payload.category_name, payload.kind)
        if category and category.type != payload.kind:
            raise ValueError("Categoria incompativel com o tipo do item.")
        if not allow_none and not category:
            raise ValueError("Categoria obrigatoria.")
        return category

    def delete(self, budget_id: str, user_id: str):
        if not self.transactions:
            raise RuntimeError("Repositorio de transacoes indisponivel.")
        try:
            budget = self.budgets.get_by_id_and_user_id(budget_id, user_id)
            deleted_transactions_count = self.transactions.delete_by_budget_id(budget.id, user_id)
            self.budgets.delete(budget.id, commit=False)
            self.db.commit()
            return {
                "status": "success",
                "message": "Registro excluído com sucesso.",
                "deleted_budget_id": budget.id,
                "deleted_transactions_count": deleted_transactions_count,
            }
        except Exception:
            self.db.rollback()
            raise
