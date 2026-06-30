from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.users.schemas import UserCreate, UserOut, UserUpdate
from app.application.users.use_cases import UserUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/lookup", response_model=UserOut)
def get_user_by_email(email: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    user = UserUseCases(repositories(db)["users"]).get_profile_by_email(email)
    assert_user_access(user.id, authenticated_user_id)
    return user


@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    _ = payload
    return UserUseCases(repositories(db)["users"]).get_profile(authenticated_user_id)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    return UserUseCases(repositories(db)["users"]).get_profile(user_id)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    return UserUseCases(repositories(db)["users"]).update_profile(user_id, payload)
