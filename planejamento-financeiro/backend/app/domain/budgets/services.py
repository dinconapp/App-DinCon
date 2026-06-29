from decimal import Decimal
from app.domain.shared import month_in_range


def active_in_month(budget, month_key: str) -> bool:
    return bool(budget.active) and month_in_range(month_key, budget.start_month, budget.end_month)


def planned_total(budgets, month_key: str, kind: str | None = None, budget_type: str | None = None) -> Decimal:
    total = Decimal("0")
    for budget in budgets:
        if not active_in_month(budget, month_key):
            continue
        if kind and budget.kind != kind:
            continue
        if budget_type and budget.budget_type != budget_type:
            continue
        total += budget.amount
    return total
