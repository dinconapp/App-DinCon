from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import BusinessRuleError
from app.domain.bills.services import payable_budgets
from app.domain.shared import due_date
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/bills", tags=["bills"])


class BillAction(BaseModel):
    user_id: str
    month_key: str = Field(pattern=r"^\d{4}-\d{2}$")


def _bill_row(budget, paid: bool):
    return {
        "budget_id": budget.id,
        "description": budget.description,
        "amount": float(budget.amount),
        "due_day": budget.due_day,
        "category_id": budget.category_id,
        "category_name": budget.category.name,
        "category_color": budget.category.color,
        "paid": paid,
    }


@router.get("")
def list_bills(
    user_id: str = Query(...),
    month_key: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    authenticated_user_id: str = Depends(require_auth_user),
):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    budgets = payable_budgets(repos["budgets"].list_by_user(user_id), month_key)
    transactions = repos["transactions"].list_by_user_month(user_id, month_key)
    paid_budget_ids = {tx.budget_id for tx in transactions if tx.status == "paid" and tx.budget_id}
    rows = [_bill_row(budget, budget.id in paid_budget_ids) for budget in budgets]
    return {
        "pending": [row for row in rows if not row["paid"]],
        "paid": [row for row in rows if row["paid"]],
    }


@router.post("/{budget_id}/pay")
def pay_bill(budget_id: str, payload: BillAction, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    budget = repos["budgets"].get(budget_id)
    assert_user_access(budget.user_id, authenticated_user_id)
    if not budget.has_due_date or budget.kind != "expense":
        raise BusinessRuleError("Este planejamento nao e uma conta pagavel.")
    repos["transactions"].delete_paid_bill(payload.user_id, budget_id, payload.month_key)
    tx = repos["transactions"].create({
        "user_id": payload.user_id,
        "budget_id": budget.id,
        "category_id": budget.category_id,
        "kind": "expense",
        "title": budget.description,
        "amount": budget.amount,
        "transaction_date": due_date(payload.month_key, budget.due_day),
        "status": "paid",
    })
    return {"paid": True, "transaction_id": tx.id}


@router.post("/{budget_id}/unpay")
def unpay_bill(budget_id: str, payload: BillAction, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    assert_user_access(repos["budgets"].get(budget_id).user_id, authenticated_user_id)
    repos["transactions"].delete_paid_bill(payload.user_id, budget_id, payload.month_key)
    return {"paid": False}


@router.post("/{budget_id}/receive")
def receive_income(budget_id: str, payload: BillAction, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    budget = repos["budgets"].get(budget_id)
    assert_user_access(budget.user_id, authenticated_user_id)
    if budget.kind != "income":
        raise BusinessRuleError("Este planejamento nao e uma entrada recebivel.")
    repos["transactions"].delete_paid_bill(payload.user_id, budget_id, payload.month_key)
    transaction_day = budget.due_day if budget.has_due_date and budget.due_day else 1
    tx = repos["transactions"].create({
        "user_id": payload.user_id,
        "budget_id": budget.id,
        "category_id": budget.category_id,
        "kind": "income",
        "title": budget.description,
        "amount": budget.amount,
        "transaction_date": due_date(payload.month_key, transaction_day),
        "status": "paid",
    })
    return {"received": True, "transaction_id": tx.id}


@router.post("/{budget_id}/unreceive")
def unreceive_income(budget_id: str, payload: BillAction, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    budget = repos["budgets"].get(budget_id)
    assert_user_access(budget.user_id, authenticated_user_id)
    if budget.kind != "income":
        raise BusinessRuleError("Este planejamento nao e uma entrada recebivel.")
    repos["transactions"].delete_paid_bill(payload.user_id, budget_id, payload.month_key)
    return {"received": False}
