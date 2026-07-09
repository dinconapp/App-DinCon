from app.application.common import model_to_dict
from app.application.categories.use_cases import CategoryUseCases
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
        self.db = transactions.db

    def list(self, user_id: str, month_key: str, filters: dict):
        rows = self.transactions.list_by_user_month(user_id, month_key, filters)
        income, expense = paid_totals(rows)
        return {
            "items": [serialize_transaction(tx) for tx in rows],
            "total_income": float(income),
            "total_expense": float(expense),
        }

    def create(self, payload):
        category = self._resolve_category(payload)
        self._validate_links(payload, category)
        data = payload.model_dump()
        data["category_id"] = category.id if category else None
        data.pop("category_name", None)
        return serialize_transaction(self.transactions.create(data))

    def update(self, transaction_id: str, payload):
        category = self._resolve_category(payload)
        self._validate_links(payload, category)
        data = payload.model_dump()
        data["category_id"] = category.id if category else None
        data.pop("category_name", None)
        return serialize_transaction(self.transactions.update(transaction_id, data))

    def delete(self, transaction_id: str, user_id: str):
        try:
            transaction = self.transactions.get_by_id_and_user_id(transaction_id, user_id)
            budget_id = transaction.budget_id
            self.transactions.delete(transaction_id, commit=False)
            self.db.flush()
            deleted_budget_id = None
            if budget_id:
                remaining = self.transactions.count_by_budget_id(budget_id, user_id)
                if remaining == 0:
                    budget = self.budgets.get_by_id_and_user_id(budget_id, user_id)
                    self.budgets.delete(budget.id, commit=False)
                    deleted_budget_id = budget.id
            self.db.commit()
            return {
                "status": "success",
                "message": "Registro excluído com sucesso.",
                "deleted_transaction_id": transaction_id,
                "deleted_budget_id": deleted_budget_id,
            }
        except Exception:
            self.db.rollback()
            raise

    def _validate_links(self, payload, category):
        if payload.kind == "expense" and not category:
            raise ValueError("Categoria obrigatoria para gastos.")
        if category and category.type != payload.kind:
            raise ValueError("Categoria incompativel com a transacao.")
        if payload.budget_id:
            budget = self.budgets.get(payload.budget_id)
            if budget.user_id != payload.user_id or budget.kind != payload.kind:
                raise ValueError("Planejamento incompativel com a transacao.")

    def _resolve_category(self, payload):
        if payload.category_id:
            return self.categories.get(payload.category_id)
        if payload.category_name:
            return CategoryUseCases(self.categories).resolve_or_create_category(payload.category_name, payload.kind, payload.user_id)
        return None
