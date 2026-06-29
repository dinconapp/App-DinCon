from pydantic import BaseModel, Field, model_validator


class SavingsInvestmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    initial_amount: float = Field(default=0, ge=0)
    monthly_contribution: float = Field(default=0, ge=0)
    interest_type: str = Field(default="compound", pattern="^(simple|compound|none)$")
    interest_rate: float = Field(default=0, ge=0)
    interest_period: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    start_month: str = Field(pattern=r"^\d{4}-\d{2}$")
    end_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")

    @model_validator(mode="after")
    def validate_months(self):
        if self.end_month and self.end_month < self.start_month:
            raise ValueError("Mes final nao pode ser menor que o mes inicial.")
        return self


class SavingsInvestmentCreate(SavingsInvestmentBase):
    user_id: str


class SavingsInvestmentUpdate(SavingsInvestmentBase):
    pass


class SavingsInvestmentOut(SavingsInvestmentCreate):
    id: str
    active: bool


class SavingsProjectionPointOut(BaseModel):
    month_key: str
    month_label: str
    invested_amount: float
    interest_amount: float
    projected_balance: float
    monthly_contribution: float
    accumulated_contributions: float
    accumulated_interest: float


class SavingsDashboardOut(BaseModel):
    total_invested_now: float
    projected_balance: float
    total_monthly_contribution: float
    projected_interest: float
    investments_count: int
    best_projection: dict | None
    projection: list[SavingsProjectionPointOut]
    investments: list[SavingsInvestmentOut]
