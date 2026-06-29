from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass
class SavingsInvestment:
    id: str
    user_id: str
    name: str
    description: str | None
    initial_amount: Decimal
    monthly_contribution: Decimal
    interest_type: str
    interest_rate: Decimal
    interest_period: str
    start_month: str
    end_month: str | None
    active: bool
    created_at: datetime
    updated_at: datetime
