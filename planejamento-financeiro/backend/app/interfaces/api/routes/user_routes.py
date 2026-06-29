from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.users.schemas import UserCreate, UserOut, UserUpdate
from app.application.users.use_cases import UserUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/lookup", response_model=UserOut)
def get_user_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    return UserUseCases(repositories(db)["users"]).get_profile_by_email(email)


@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    return UserUseCases(repositories(db)["users"]).create_profile(payload)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    return UserUseCases(repositories(db)["users"]).get_profile(user_id)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db)):
    return UserUseCases(repositories(db)["users"]).update_profile(user_id, payload)
