from dataclasses import dataclass


@dataclass(frozen=True)
class Category:
    id: str
    name: str
    type: str
    icon_key: str | None
    color: str | None
    active: bool
