from app.application.common import model_to_dict


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
    def __init__(self, budgets, categories):
        self.budgets = budgets
        self.categories = categories

    def list(self, user_id: str):
        return [serialize_budget(budget) for budget in self.budgets.list_by_user(user_id)]

    def create(self, payload):
        category = self.categories.get(payload.category_id)
        if category.type != payload.kind:
            raise ValueError("Categoria incompativel com o tipo do item.")
        data = payload.model_dump()
        if data["budget_type"] == "fixed":
            data["end_month"] = None
        return serialize_budget(self.budgets.create(data))

    def update(self, budget_id: str, payload):
        category = self.categories.get(payload.category_id)
        if category.type != payload.kind:
            raise ValueError("Categoria incompativel com o tipo do item.")
        data = payload.model_dump()
        if data["budget_type"] == "fixed":
            data["end_month"] = None
        return serialize_budget(self.budgets.update(budget_id, data))

    def delete(self, budget_id: str):
        self.budgets.delete(budget_id)
        return {"deleted": True}
