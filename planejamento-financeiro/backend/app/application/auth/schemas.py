from pydantic import BaseModel, Field, field_validator


def _validate_email(value: str) -> str:
    normalized = value.strip().lower()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise ValueError("E-mail invalido.")
    return normalized


def _normalize_phone(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) == 11 and not digits.startswith("55"):
        digits = f"55{digits}"
    if len(digits) < 11:
        raise ValueError("Celular deve estar em formato internacional.")
    return f"+{digits}"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=180)
    phone: str = Field(min_length=11, max_length=30)
    password: str = Field(min_length=6, max_length=4096)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _normalize_phone(value)


class VerifyEmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=180)
    code: str = Field(min_length=1, max_length=20)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class ResendEmailCodeRequest(BaseModel):
    email: str = Field(min_length=3, max_length=180)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=180)
    password: str = Field(min_length=1, max_length=4096)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class PasswordResetStartRequest(BaseModel):
    email: str = Field(min_length=3, max_length=180)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class PasswordResetConfirmRequest(BaseModel):
    email: str = Field(min_length=3, max_length=180)
    code: str = Field(min_length=1, max_length=20)
    password: str = Field(min_length=6, max_length=4096)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class UserAuthResponse(BaseModel):
    id: str
    name: str
    email: str
    email_verified: bool
    active: bool


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAuthResponse
