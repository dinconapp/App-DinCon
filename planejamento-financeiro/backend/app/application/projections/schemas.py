from pydantic import BaseModel


class ProjectionOut(BaseModel):
    items: list[dict]
    markers: dict
