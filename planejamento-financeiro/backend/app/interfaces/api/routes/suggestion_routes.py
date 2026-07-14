from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.application.suggestions.schemas import SuggestionCreate, SuggestionOut
from app.application.suggestions.use_cases import SuggestionUseCases
from app.core.database import get_db
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("", response_model=list[SuggestionOut])
def list_suggestions(user_id: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    return SuggestionUseCases(repos["suggestions"], repos["users"]).list(user_id)


@router.post("", response_model=SuggestionOut)
def create_suggestion(payload: SuggestionCreate, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    return SuggestionUseCases(repos["suggestions"], repos["users"]).create(payload)
