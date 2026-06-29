from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Budget:
    id: str
    user_id: str
    category_id: str
    description: str
    kind: str
    budget_type: str
    amount: Decimal
    start_month: str | None
    end_month: str | None
    has_due_date: bool
    due_day: int | None
    active: bool
