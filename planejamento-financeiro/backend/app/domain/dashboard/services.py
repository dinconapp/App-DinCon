from collections import defaultdict
from decimal import Decimal
from app.domain.bills.services import payable_budgets
from app.domain.budgets.services import active_in_month, planned_total
from app.domain.shared import current_month_key, month_label, shift_month
from app.domain.transactions.services import paid_totals


def economy_for_month(user, budgets, transactions, month_key: str) -> Decimal:
    if month_key > current_month_key():
        return planned_total(budgets, month_key, "income") - planned_total(budgets, month_key, "expense")
    income, expense = paid_totals(transactions)
    return income - expense


def accumulated_balance(user, budgets, transactions_by_month: dict[str, list], month_key: str) -> Decimal:
    total = user.initial_balance
    key = user.base_month
    while key <= month_key:
        total += economy_for_month(user, budgets, transactions_by_month.get(key, []), key)
        key = shift_month(key, 1)
    return total


def dashboard_payload(user, budgets, transactions, transactions_by_month, month_key: str):
    current = current_month_key()
    is_projected = month_key > current
    real_income, real_expense = paid_totals(transactions)
    planned_income = planned_total(budgets, month_key, "income")
    planned_expense = planned_total(budgets, month_key, "expense")
    total_income = planned_income if is_projected else real_income
    total_expense = planned_expense if is_projected else real_expense
    economy = total_income - total_expense
    saving_rate = float((economy / total_income * 100) if total_income else 0)

    paid_budget_ids = {tx.budget_id for tx in transactions if tx.status == "paid" and tx.budget_id}
    bills = []
    for budget in payable_budgets(budgets, month_key):
        paid = budget.id in paid_budget_ids
        bills.append(_budget_line(budget) | {"paid": paid})

    expenses_by_category = defaultdict(lambda: {"amount": Decimal("0"), "category": "", "color": "#9AA3B2"})
    for tx in transactions:
        if tx.kind == "expense" and tx.status == "paid":
            key = tx.category_id
            expenses_by_category[key]["amount"] += tx.amount
            expenses_by_category[key]["category"] = tx.category.name if tx.category else "Sem categoria"
            expenses_by_category[key]["color"] = (tx.category.color if tx.category else None) or "#9AA3B2"

    ranking = _ranking(user, budgets, transactions_by_month, month_key)
    return {
        "month_key": month_key,
        "month_label": month_label(month_key),
        "is_past": month_key < current,
        "is_current": month_key == current,
        "is_projected": is_projected,
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "economy": float(economy),
        "saving_rate": saving_rate,
        "accumulated_balance": float(accumulated_balance(user, budgets, transactions_by_month, month_key)),
        "planned_income": float(planned_income),
        "planned_expense": float(planned_expense),
        "planned_fixed_expense": float(planned_total(budgets, month_key, "expense", "fixed")),
        "planned_variable_expense": float(planned_total(budgets, month_key, "expense", "variable")),
        "real_income": float(real_income),
        "real_expense": float(real_expense),
        "fixed_expenses": _budget_progress(budgets, transactions, month_key, "expense", "fixed"),
        "variable_expenses": _variable_expenses(budgets, transactions, month_key),
        "incomes": _budget_progress(budgets, transactions, month_key, "income", None),
        "pending_bills": [bill for bill in bills if not bill["paid"]],
        "paid_bills": [bill for bill in bills if bill["paid"]],
        "pending_total": float(sum((Decimal(str(b["amount"])) for b in bills if not b["paid"]), Decimal("0"))),
        "expenses_by_category": [
            {"category_id": key, "category": value["category"], "amount": float(value["amount"]), "color": value["color"]}
            for key, value in expenses_by_category.items()
        ],
        "ranking_position": ranking["position"],
        "ranking_label": ranking["label"],
    }


def _budget_line(budget):
    return {
        "id": budget.id,
        "description": budget.description,
        "amount": float(budget.amount),
        "category_id": budget.category_id,
        "category": budget.category.name,
        "icon_key": budget.category.icon_key,
        "color": budget.category.color,
        "due_day": budget.due_day,
    }


def _budget_progress(budgets, transactions, month_key, kind, budget_type):
    rows = []
    for budget in budgets:
        if budget.kind != kind or not active_in_month(budget, month_key):
            continue
        if budget_type and budget.budget_type != budget_type:
            continue
        realized = sum((tx.amount for tx in transactions if _is_paid(tx) and tx.budget_id == budget.id), Decimal("0"))
        rows.append(_budget_line(budget) | {"realized": float(realized), "budget_type": budget.budget_type})
    return rows


def _variable_expenses(budgets, transactions, month_key):
    rows = _budget_progress(budgets, transactions, month_key, "expense", "variable")

    for tx in transactions:
        if not _is_variable_unplanned_expense(tx):
            continue
        rows.append({
            "id": f"tx-{tx.id}",
            "description": tx.title,
            "amount": float(tx.amount),
            "realized": float(tx.amount),
            "category_id": tx.category_id,
            "category": tx.category.name if tx.category else "Sem categoria",
            "icon_key": tx.category.icon_key if tx.category else None,
            "color": (tx.category.color if tx.category else None) or "#9AA3B2",
            "due_day": None,
            "budget_type": "transaction",
        })
    return rows


def _is_paid(tx) -> bool:
    return tx.status == "paid"


def _budget_type(tx):
    return tx.budget.budget_type if tx.budget else None


def _is_expense(tx) -> bool:
    return tx.kind == "expense"


def _is_variable_unplanned_expense(tx) -> bool:
    if not _is_expense(tx) or not _is_paid(tx):
        return False
    return tx.budget_id is None or tx.budget is None


def _ranking(user, budgets, transactions_by_month, month_key):
    year = month_key[:4]
    rows = []
    for m in range(1, 13):
        key = f"{year}-{m:02d}"
        rows.append((key, economy_for_month(user, budgets, transactions_by_month.get(key, []), key)))
    ordered = sorted(rows, key=lambda item: item[1], reverse=True)
    position = next((i + 1 for i, item in enumerate(ordered) if item[0] == month_key), 0)
    return {"position": position, "label": f"{position}o melhor mes do ano" if position else "Sem ranking"}
