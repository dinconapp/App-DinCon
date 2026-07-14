from pydantic import BaseModel, Field


class SuggestionCreate(BaseModel):
    user_id: str
    title: str = Field(min_length=1, max_length=180)
    message: str = Field(min_length=1, max_length=4000)


class SuggestionOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    status: str
    created_at: str
    updated_at: str
