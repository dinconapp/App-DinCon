from dataclasses import dataclass
from datetime import datetime


@dataclass
class VerifyStartResult:
    status: str
    provider_verification_sid: str | None = None


@dataclass
class VerifyCheckResult:
    status: str
    approved: bool = False


@dataclass
class AuthenticatedUser:
    id: str
    name: str
    email: str
    email_verified: bool
    active: bool
    last_login_at: datetime | None = None
