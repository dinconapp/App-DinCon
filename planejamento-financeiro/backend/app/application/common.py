from datetime import date, datetime
from decimal import Decimal


def money(value) -> float:
    return float(value or Decimal("0"))


def model_to_dict(model, fields: list[str]) -> dict:
    data = {}
    for field in fields:
        value = getattr(model, field)
        if isinstance(value, Decimal):
            value = float(value)
        if isinstance(value, (date, datetime)):
            value = value.isoformat()
        data[field] = value
    return data
