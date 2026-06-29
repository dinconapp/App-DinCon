from decimal import Decimal
from app.domain.budgets.services import planned_total
from app.domain.shared import month_short, shift_month


def balance_projection(user, budgets, months: int):
    balance = user.initial_balance
    rows = []
    start = user.base_month
    for index in range(months):
        key = shift_month(start, index)
        balance += planned_total(budgets, key, "income") - planned_total(budgets, key, "expense")
        rows.append({"month_key": key, "month_short": month_short(key), "balance": float(balance)})
    return rows


def projection_markers(rows):
    def at(index: int) -> Decimal:
        if not rows:
            return Decimal("0")
        safe = min(index, len(rows) - 1)
        return Decimal(str(rows[safe]["balance"]))

    return {
        "end_of_month": float(at(0)),
        "in_6_months": float(at(5)),
        "in_1_year": float(at(11)),
        "in_5_years": float(at(min(59, len(rows) - 1))),
    }
