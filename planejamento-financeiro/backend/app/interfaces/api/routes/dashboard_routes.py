from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.dashboard.schemas import DashboardOut
from app.application.dashboard.use_cases import DashboardUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(user_id: str = Query(...), month_key: str = Query(..., pattern=r"^\d{4}-\d{2}$"), db: Session = Depends(get_db)):
    repos = repositories(db)
    return DashboardUseCases(repos["users"], repos["budgets"], repos["transactions"]).get(user_id, month_key)
