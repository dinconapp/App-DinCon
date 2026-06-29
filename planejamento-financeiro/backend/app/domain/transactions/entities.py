from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    id: str
    user_id: str
    budget_id: str | None
    category_id: str
    kind: str
    title: str
    amount: Decimal
    transaction_date: date
    status: str
