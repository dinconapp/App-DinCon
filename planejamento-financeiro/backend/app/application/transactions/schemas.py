from datetime import date
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    user_id: str
    budget_id: str | None = None
    category_id: str | None = None
    kind: str = Field(pattern="^(income|expense)$")
    title: str = Field(min_length=1, max_length=180)
    amount: float = Field(gt=0)
    transaction_date: date
    status: str = Field(default="paid", pattern="^(paid|pending|canceled)$")


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: str
    category_name: str | None = None
    category_color: str | None = None
    budget_description: str | None = None
    budget_type: str | None = None
    is_fixed_bill: bool = False
