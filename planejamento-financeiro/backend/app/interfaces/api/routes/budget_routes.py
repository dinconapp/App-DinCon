from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.budgets.schemas import BudgetCreate, BudgetOut, BudgetUpdate
from app.application.budgets.use_cases import BudgetUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
def list_budgets(user_id: str = Query(...), db: Session = Depends(get_db)):
    repos = repositories(db)
    return BudgetUseCases(repos["budgets"], repos["categories"]).list(user_id)


@router.post("", response_model=BudgetOut)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    repos = repositories(db)
    return BudgetUseCases(repos["budgets"], repos["categories"]).create(payload)


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: str, payload: BudgetUpdate, db: Session = Depends(get_db)):
    repos = repositories(db)
    return BudgetUseCases(repos["budgets"], repos["categories"]).update(budget_id, payload)


@router.delete("/{budget_id}")
def delete_budget(budget_id: str, db: Session = Depends(get_db)):
    repos = repositories(db)
    return BudgetUseCases(repos["budgets"], repos["categories"]).delete(budget_id)
