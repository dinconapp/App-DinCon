import logging

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.application.whatsapp.schemas import WhatsAppAccountCreate, WhatsAppAccountOut, WhatsAppTransactionDraftOut
from app.application.whatsapp.use_cases import WhatsAppAccountUseCases, WhatsAppDraftUseCases, WhatsAppWebhookUseCases
from app.core.database import get_db
from app.infrastructure.ai.audio_transcriber import AudioTranscriber
from app.infrastructure.ai.transaction_interpreter import TransactionInterpreter
from app.infrastructure.whatsapp.providers.twilio_provider import TwilioWhatsAppProvider
from app.interfaces.api.dependencies import repositories

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
def list_accounts(user_id: str = Query(...), db: Session = Depends(get_db)):
    repos = repositories(db)
    return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"]).list(user_id)


@router.post("/accounts", response_model=WhatsAppAccountOut)
def create_account(payload: WhatsAppAccountCreate, db: Session = Depends(get_db)):
    repos = repositories(db)
    return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"]).create(payload)


@router.delete("/accounts/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    repos = repositories(db)
    return WhatsAppAccountUseCases(repos["whatsapp_accounts"], repos["users"]).deactivate(account_id)


@router.get("/drafts", response_model=list[WhatsAppTransactionDraftOut])
def list_drafts(user_id: str = Query(...), status: str | None = Query(default=None), db: Session = Depends(get_db)):
    repos = repositories(db)
    return WhatsAppDraftUseCases(repos["whatsapp_drafts"], repos["users"]).list(user_id, status)
