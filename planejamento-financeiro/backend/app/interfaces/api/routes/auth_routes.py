import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.application.auth.schemas import AuthTokenResponse, LoginRequest, PasswordResetConfirmRequest, PasswordResetStartRequest, RegisterRequest, ResendEmailCodeRequest, UserAuthResponse, VerifyEmailRequest
from app.application.auth.use_cases import AuthUseCases
from app.core.database import get_db
from app.domain.auth.services import AuthError
from app.infrastructure.auth.jwt_provider import JwtProvider
from app.infrastructure.auth.password_hasher import PasswordHasher
from app.infrastructure.auth.password_cipher import PasswordCipher
from app.infrastructure.verification.twilio_email_verify_provider import TwilioEmailVerifyProvider
from app.interfaces.api.dependencies import repositories, require_auth_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def use_cases(db: Session) -> AuthUseCases:
    repos = repositories(db)
    return AuthUseCases(
        repos["auth_users"],
        repos["email_verifications"],
        PasswordHasher(),
        PasswordCipher(),
        JwtProvider(),
        TwilioEmailVerifyProvider(),
    )


def auth_error(context: str, exc: AuthError):
    logger.warning("%s rejected status=%s status_code=%s", context, exc.status, exc.status_code)
    raise HTTPException(status_code=exc.status_code, detail={"status": exc.status, "message": str(exc)})


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.register.request_received email=%s phone=...%s", payload.email.strip().lower(), payload.phone[-4:])
        return use_cases(db).register(payload)
    except AuthError as exc:
        auth_error("auth.register", exc)
    except Exception:
        logger.exception("auth.register.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.verify_email.request_received email=%s", payload.email.strip().lower())
        return use_cases(db).verify_email(payload)
    except AuthError as exc:
        auth_error("auth.verify_email", exc)
    except Exception:
        logger.exception("auth.verify_sms.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.post("/resend-email-code")
def resend_email_code(payload: ResendEmailCodeRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.resend_email_code.request_received email=%s", payload.email.strip().lower())
        return use_cases(db).resend_email_code(payload)
    except AuthError as exc:
        auth_error("auth.resend_email_code", exc)
    except Exception:
        logger.exception("auth.resend_sms.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.login.request_received email=%s", payload.email.strip().lower())
        return use_cases(db).login(payload)
    except AuthError as exc:
        auth_error("auth.login", exc)
    except Exception:
        logger.exception("auth.login.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.post("/password-reset/start")
def password_reset_start(payload: PasswordResetStartRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.password_reset_start.request_received email=%s", payload.email.strip().lower())
        return use_cases(db).start_password_reset(payload)
    except AuthError as exc:
        auth_error("auth.password_reset_start", exc)
    except Exception:
        logger.exception("auth.password_reset_start.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    try:
        logger.info("auth.password_reset_confirm.request_received email=%s", payload.email.strip().lower())
        return use_cases(db).confirm_password_reset(payload)
    except AuthError as exc:
        auth_error("auth.password_reset_confirm", exc)
    except Exception:
        logger.exception("auth.password_reset_confirm.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})


@router.get("/me", response_model=UserAuthResponse)
def me(user_id: str = Depends(require_auth_user), db: Session = Depends(get_db)):
    try:
        logger.info("auth.me.request_received user_id=%s", user_id)
        return use_cases(db).me(user_id)
    except Exception:
        logger.exception("auth.me.unhandled")
        raise HTTPException(status_code=500, detail={"status": "internal_error", "message": "Erro interno do servidor."})
