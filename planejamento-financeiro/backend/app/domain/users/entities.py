from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class User:
    id: str
    name: str
    initial: str
    initial_balance: Decimal
    base_month: str
