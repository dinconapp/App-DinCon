from app.domain.budgets.services import active_in_month


def payable_budgets(budgets, month_key: str):
    return [
        budget
        for budget in budgets
        if budget.kind == "expense" and budget.budget_type == "fixed" and budget.has_due_date and active_in_month(budget, month_key)
    ]
