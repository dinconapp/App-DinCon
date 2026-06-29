from app.application.common import model_to_dict
from app.domain.transactions.services import paid_totals


TX_FIELDS = ["id", "user_id", "budget_id", "category_id", "kind", "title", "amount", "transaction_date", "status"]


def serialize_transaction(tx):
    budget = tx.budget
    return model_to_dict(tx, TX_FIELDS) | {
        "category_name": tx.category.name if tx.category else None,
        "category_color": tx.category.color if tx.category else None,
        "budget_description": budget.description if budget else None,
        "budget_type": budget.budget_type if budget else None,
        "is_fixed_bill": bool(budget and budget.budget_type == "fixed" and budget.has_due_date),
    }


class TransactionUseCases:
    def __init__(self, transactions, categories, budgets):
        self.transactions = transactions
        self.categories = categories
        self.budgets = budgets

    def list(self, user_id: str, month_key: str, filters: dict):
        rows = self.transactions.list_by_user_month(user_id, month_key, filters)
        income, expense = paid_totals(rows)
        return {
            "items": [serialize_transaction(tx) for tx in rows],
            "total_income": float(income),
            "total_expense": float(expense),
        }

    def create(self, payload):
        self._validate_links(payload)
        return serialize_transaction(self.transactions.create(payload.model_dump()))

    def update(self, transaction_id: str, payload):
        self._validate_links(payload)
        return serialize_transaction(self.transactions.update(transaction_id, payload.model_dump()))

    def delete(self, transaction_id: str):
        self.transactions.delete(transaction_id)
        return {"deleted": True}

    def _validate_links(self, payload):
        if payload.kind == "expense" and not payload.category_id:
            raise ValueError("Categoria obrigatoria para gastos.")
        if payload.category_id:
            category = self.categories.get(payload.category_id)
            if category.type != payload.kind:
                raise ValueError("Categoria incompativel com a transacao.")
        if payload.budget_id:
            budget = self.budgets.get(payload.budget_id)
            if budget.user_id != payload.user_id or budget.kind != payload.kind:
                raise ValueError("Planejamento incompativel com a transacao.")
