import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.application.whatsapp.schemas import WhatsAppAccountCreate, WhatsAppAccountOut, WhatsAppAccountUpdate, WhatsAppTransactionDraftOut
from app.application.whatsapp.use_cases import WhatsAppAccountUseCases, WhatsAppDraftUseCases, WhatsAppWebhookUseCases
from app.core.database import get_db
from app.core.exceptions import BusinessRuleError
from app.infrastructure.ai.audio_transcriber import AudioTranscriber
from app.infrastructure.ai.transaction_interpreter import TransactionInterpreter
from app.infrastructure.whatsapp.providers.twilio_provider import TwilioWhatsAppProvider
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations/whatsapp", tags=["whatsapp"])


def webhook_use_cases(db: Session):
    repos = repositories(db)
    return WhatsAppWebhookUseCases(
        repos["whatsapp_accounts"],
        repos["whatsapp_messages"],
        repos["whatsapp_drafts"],
        repos["transactions"],
        repos["categories"],
        repos["billing"],
        TwilioWhatsAppProvider(),
        TransactionInterpreter(),
        AudioTranscriber(),
    )


@router.post("/twilio/webhook")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    form = dict(await request.form())
    provider = TwilioWhatsAppProvider()
    signature = request.headers.get("X-Twilio-Signature")
    logger.info(
        "twilio.webhook.request content_type=%s has_signature=%s form_keys=%s",
        request.headers.get("content-type"),
        bool(signature),
        sorted(form.keys()),
    )
    if not provider.validate_signature(str(request.url), form, signature):
        logger.warning("twilio.webhook.invalid_signature url=%s", request.url)
        return Response(content=provider.twiml_response("Assinatura invalida."), media_type="application/xml", status_code=403)
    try:
        xml = webhook_use_cases(db).handle_twilio_webhook(form)
    except Exception:
        logger.exception("twilio.webhook.unhandled_error")
        xml = provider.twiml_response("Tive um problema ao processar sua mensagem. Tente novamente em instantes.")
    return Response(content=xml, media_type="application/xml")


@router.post("/twilio/status")
async def twilio_status(request: Request):
    form = dict(await request.form())
    logger.info("twilio.status.request form_keys=%s", sorted(form.keys()))
    return {"ok": True}


@router.get("/accounts", response_model=list[WhatsAppAccountOut])
def list_accounts(user_id: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    try:
        return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"], repos["billing"]).list(user_id)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/accounts", response_model=WhatsAppAccountOut)
def create_account(payload: WhatsAppAccountCreate, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    repos = repositories(db)
    try:
        return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"], repos["billing"]).create(payload)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/accounts/{account_id}", response_model=WhatsAppAccountOut)
def update_account(account_id: str, payload: WhatsAppAccountUpdate, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    repos = repositories(db)
    assert_user_access(repos["whatsapp_accounts"].get(account_id).user_id, authenticated_user_id)
    try:
        return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"], repos["billing"]).update(account_id, payload)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/accounts/{account_id}/deactivate")
def deactivate_account(account_id: str, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    repos = repositories(db)
    assert_user_access(repos["whatsapp_accounts"].get(account_id).user_id, authenticated_user_id)
    try:
        return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"], repos["billing"]).deactivate(account_id)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete("/accounts/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    return deactivate_account(account_id, db, authenticated_user_id)


@router.get("/drafts", response_model=list[WhatsAppTransactionDraftOut])
def list_drafts(user_id: str = Query(...), status: str | None = Query(default=None), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    repos = repositories(db)
    return WhatsAppDraftUseCases(repos["whatsapp_drafts"], repos["users"]).list(user_id, status)
