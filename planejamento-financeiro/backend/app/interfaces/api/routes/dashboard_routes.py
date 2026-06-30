from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.dashboard.schemas import DashboardOut
from app.application.dashboard.use_cases import DashboardUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(
    user_id: str = Query(...),
    month_key: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    authenticated_user_id: str = Depends(require_auth_user),
):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    return DashboardUseCases(repos["users"], repos["budgets"], repos["transactions"]).get(user_id, month_key)
