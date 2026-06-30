from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.projections.schemas import ProjectionOut
from app.application.projections.use_cases import ProjectionUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/projections", tags=["projections"])


@router.get("/balance", response_model=ProjectionOut)
def balance_projection(user_id: str = Query(...), months: int = Query(default=12, ge=1, le=60), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    return ProjectionUseCases(repos["users"], repos["budgets"]).balance(user_id, months)
