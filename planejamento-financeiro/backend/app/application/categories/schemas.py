from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: str
    name: str
    type: str
    icon_key: str | None = None
    color: str | None = None
    active: bool
