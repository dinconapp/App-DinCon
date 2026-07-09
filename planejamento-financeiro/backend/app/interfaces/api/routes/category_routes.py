from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.categories.schemas import CategoryOut
from app.application.categories.use_cases import CategoryUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories, require_auth_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    db: Session = Depends(get_db),
    authenticated_user_id: str = Depends(require_auth_user),
):
    return CategoryUseCases(repositories(db)["categories"]).list(type, authenticated_user_id)
