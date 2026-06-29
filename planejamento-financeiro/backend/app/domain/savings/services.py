from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass
class SavingsProjectionPoint:
    month_key: str
    month_label: str
    invested_amount: Decimal
    interest_amount: Decimal
    projected_balance: Decimal
    monthly_contribution: Decimal
    accumulated_contributions: Decimal
    accumulated_interest: Decimal


def validate_month_range(start_month: str, end_month: str | None = None) -> None:
    if len(start_month) != 7 or start_month[4] != "-":
        raise ValueError("Mes inicial invalido.")
    if end_month and (len(end_month) != 7 or end_month[4] != "-"):
        raise ValueError("Mes final invalido.")
    if end_month and end_month < start_month:
        raise ValueError("Mes final nao pode ser menor que o mes inicial.")


def add_months(month_key: str, offset: int) -> str:
    year = int(month_key[:4])
    month = int(month_key[5:])
    total = year * 12 + month - 1 + offset
    return f"{total // 12:04d}-{total % 12 + 1:02d}"


def month_label(month_key: str) -> str:
    labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    month = int(month_key[5:])
    return f"{labels[month - 1]}/{month_key[:4]}"


def monthly_rate(interest_rate: Decimal, interest_period: str) -> Decimal:
    rate = Decimal(interest_rate) / Decimal("100")
    if interest_period == "yearly":
        return Decimal(str((1 + float(rate)) ** (1 / 12) - 1))
    return rate


def money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def project_investment(investment, months: int) -> list[SavingsProjectionPoint]:
    validate_month_range(investment.start_month, investment.end_month)
    rate = monthly_rate(Decimal(investment.interest_rate), investment.interest_period)
    balance = Decimal(investment.initial_amount)
    accumulated_contributions = Decimal(investment.initial_amount)
    accumulated_interest = Decimal("0")
    points: list[SavingsProjectionPoint] = []

    for index in range(months):
        month_key = add_months(investment.start_month, index)
        is_active_month = not investment.end_month or month_key <= investment.end_month
        contribution = Decimal(investment.monthly_contribution) if is_active_month else Decimal("0")
        previous_balance = balance

        if not is_active_month:
            interest = Decimal("0")
        elif investment.interest_type == "none":
            interest = Decimal("0")
            balance = balance + contribution
        elif investment.interest_type == "simple":
            interest = Decimal(investment.initial_amount) * rate
            balance = balance + contribution + interest
        else:
            interest = previous_balance * rate
            balance = previous_balance + interest + contribution

        if is_active_month:
            accumulated_contributions += contribution
            accumulated_interest += interest

        points.append(SavingsProjectionPoint(
            month_key=month_key,
            month_label=month_label(month_key),
            invested_amount=money(accumulated_contributions),
            interest_amount=money(interest),
            projected_balance=money(balance),
            monthly_contribution=money(contribution),
            accumulated_contributions=money(accumulated_contributions),
            accumulated_interest=money(accumulated_interest),
        ))

    return points
