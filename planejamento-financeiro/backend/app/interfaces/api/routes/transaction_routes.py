from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.transactions.schemas import TransactionCreate, TransactionOut, TransactionUpdate
from app.application.transactions.use_cases import TransactionUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(
    user_id: str = Query(...),
    month_key: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    kind: str | None = Query(default=None, pattern="^(income|expense)$"),
    category_id: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    repos = repositories(db)
    filters = {"kind": kind, "category_id": category_id, "search": search}
    return TransactionUseCases(repos["transactions"], repos["categories"], repos["budgets"]).list(user_id, month_key, filters)


@router.post("", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    repos = repositories(db)
    return TransactionUseCases(repos["transactions"], repos["categories"], repos["budgets"]).create(payload)


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: str, payload: TransactionUpdate, db: Session = Depends(get_db)):
    repos = repositories(db)
    return TransactionUseCases(repos["transactions"], repos["categories"], repos["budgets"]).update(transaction_id, payload)


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str, db: Session = Depends(get_db)):
    repos = repositories(db)
    return TransactionUseCases(repos["transactions"], repos["categories"], repos["budgets"]).delete(transaction_id)
