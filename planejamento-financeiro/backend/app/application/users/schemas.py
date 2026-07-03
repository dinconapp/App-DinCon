from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=180)
    phone: str | None = Field(default=None, max_length=30)
    zip_code: str | None = Field(default=None, max_length=20)
    address_number: str | None = Field(default=None, max_length=30)
    residence_type: str | None = Field(default=None, max_length=30, pattern=r"^(house|apartment)$")
    street_name: str | None = Field(default=None, max_length=180)
    neighborhood: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    federal_unit: str | None = Field(default=None, max_length=2)
    complement: str | None = Field(default=None, max_length=120)
    initial_balance: float = 0
    base_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=180)
    phone: str | None = Field(default=None, max_length=30)
    zip_code: str | None = Field(default=None, max_length=20)
    address_number: str | None = Field(default=None, max_length=30)
    residence_type: str | None = Field(default=None, max_length=30, pattern=r"^(house|apartment)$")
    street_name: str | None = Field(default=None, max_length=180)
    neighborhood: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    federal_unit: str | None = Field(default=None, max_length=2)
    complement: str | None = Field(default=None, max_length=120)
    initial_balance: float | None = None
    base_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")


class UserOut(BaseModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    zip_code: str | None = None
    address_number: str | None = None
    residence_type: str | None = None
    street_name: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    federal_unit: str | None = None
    complement: str | None = None
    initial: str
    initial_balance: float
    base_month: str
    budget_count: int = 0
    transaction_count: int = 0
    database_connected: bool = False
    active: bool = True
    email_verified: bool = False
    verification_status: str = "not_started"
