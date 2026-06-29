from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.savings.schemas import SavingsDashboardOut, SavingsInvestmentCreate, SavingsInvestmentOut, SavingsInvestmentUpdate, SavingsProjectionPointOut
from app.application.savings.use_cases import SavingsUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/savings", tags=["savings"])


def use_cases(db: Session):
    repos = repositories(db)
    return SavingsUseCases(repos["savings"], repos["users"])


@router.get("/investments", response_model=list[SavingsInvestmentOut])
def list_investments(user_id: str = Query(...), db: Session = Depends(get_db)):
    return use_cases(db).list_investments(user_id)


@router.get("/investments/{investment_id}", response_model=SavingsInvestmentOut)
def get_investment(investment_id: str, db: Session = Depends(get_db)):
    return use_cases(db).get_investment(investment_id)


@router.post("/investments", response_model=SavingsInvestmentOut)
def create_investment(payload: SavingsInvestmentCreate, db: Session = Depends(get_db)):
    return use_cases(db).create_investment(payload)


@router.put("/investments/{investment_id}", response_model=SavingsInvestmentOut)
def update_investment(investment_id: str, payload: SavingsInvestmentUpdate, db: Session = Depends(get_db)):
    return use_cases(db).update_investment(investment_id, payload)


@router.delete("/investments/{investment_id}")
def delete_investment(investment_id: str, db: Session = Depends(get_db)):
    return use_cases(db).delete_investment(investment_id)


@router.get("/dashboard", response_model=SavingsDashboardOut)
def dashboard(user_id: str = Query(...), months: int = Query(default=12, ge=1, le=120), db: Session = Depends(get_db)):
    return use_cases(db).dashboard(user_id, months)


@router.get("/projection", response_model=list[SavingsProjectionPointOut])
def projection(user_id: str = Query(...), months: int = Query(default=12, ge=1, le=120), db: Session = Depends(get_db)):
    return use_cases(db).consolidated_projection(user_id, months)


@router.get("/investments/{investment_id}/projection", response_model=list[SavingsProjectionPointOut])
def investment_projection(investment_id: str, months: int = Query(default=12, ge=1, le=120), db: Session = Depends(get_db)):
    return use_cases(db).investment_projection(investment_id, months)
