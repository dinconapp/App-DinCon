from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Suggestion:
    id: str
    user_id: str
    title: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime
