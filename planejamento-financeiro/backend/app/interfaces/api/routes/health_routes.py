from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "service": "dincon-backend",
        "env": settings.app_env,
    }


@router.get("/db")
def health_db(db: Session = Depends(get_db)):
    settings = get_settings()
    connected = False
    try:
        connected = bool(db.execute(text("SELECT 1")).scalar())
    except Exception:
        connected = False
    return {
        "status": "ok" if connected else "degraded",
        "app_env": settings.app_env,
        "database_connected": connected,
        "database_name": settings.db_name,
    }
