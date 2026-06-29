from decimal import Decimal


def paid_totals(transactions) -> tuple[Decimal, Decimal]:
    income = Decimal("0")
    expense = Decimal("0")
    for tx in transactions:
        if tx.status != "paid":
            continue
        if tx.kind == "income":
            income += tx.amount
        if tx.kind == "expense":
            expense += tx.amount
    return income, expense
