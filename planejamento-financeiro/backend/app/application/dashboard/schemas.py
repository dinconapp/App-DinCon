from pydantic import BaseModel


class DashboardOut(BaseModel):
    month_key: str
    month_label: str
    is_past: bool
    is_current: bool
    is_projected: bool
    total_income: float
    total_expense: float
    economy: float
    saving_rate: float
    accumulated_balance: float
    planned_income: float
    planned_expense: float
    planned_fixed_expense: float
    planned_variable_expense: float
    real_income: float
    real_expense: float
    fixed_expenses: list[dict]
    variable_expenses: list[dict]
    incomes: list[dict]
    pending_bills: list[dict]
    paid_bills: list[dict]
    pending_total: float
    expenses_by_category: list[dict]
    ranking_position: int
    ranking_label: str
