from pydantic import BaseModel, Field, model_validator


class BudgetBase(BaseModel):
    user_id: str
    description: str = Field(min_length=1, max_length=180)
    kind: str = Field(pattern="^(income|expense)$")
    category_id: str
    budget_type: str = Field(pattern="^(fixed|variable)$")
    amount: float = Field(gt=0)
    start_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    end_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    has_due_date: bool = False
    due_day: int | None = Field(default=None, ge=1, le=31)

    @model_validator(mode="after")
    def validate_months(self):
        if self.start_month and self.end_month and self.end_month < self.start_month:
            raise ValueError("end_month nao pode ser menor que start_month.")
        if self.has_due_date and not self.due_day:
            raise ValueError("due_day e obrigatorio quando has_due_date for true.")
        return self


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: str
    active: bool
    category_name: str | None = None
    category_color: str | None = None
    category_icon_key: str | None = None
