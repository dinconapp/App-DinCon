import hashlib
import hmac

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.application.billing.schemas import CheckoutCardRequest, CheckoutPixRequest, PaymentOut, PlanOut
from app.application.billing.use_cases import BillingUseCases
from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.domain.billing.services import BillingError
from app.infrastructure.payments.mercado_pago_provider import MercadoPagoProvider
from app.interfaces.api.dependencies import assert_user_access, repositories, require_auth_user

router = APIRouter(prefix="/billing", tags=["billing"])


def use_cases(db: Session):
    repos = repositories(db)
    return BillingUseCases(repos["billing"], repos["users"], MercadoPagoProvider(), get_settings())


def validate_mercado_pago_signature(request: Request, payment_id: str | None) -> None:
    secret = get_settings().mercado_pago_webhook_secret.strip()
    if not secret:
        return
    request_id = request.headers.get("x-request-id", "")
    signature_header = request.headers.get("x-signature", "")
    signature_parts = {
        key.strip(): value.strip()
        for part in signature_header.split(",")
        if "=" in part
        for key, value in [part.split("=", 1)]
    }
    timestamp = signature_parts.get("ts", "")
    received = signature_parts.get("v1", "")
    if not payment_id or not request_id or not timestamp or not received:
        raise HTTPException(status_code=403, detail="Assinatura Mercado Pago ausente ou incompleta.")
    signed_payload = f"id:{payment_id};request-id:{request_id};ts:{timestamp};"
    expected = hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received):
        raise HTTPException(status_code=403, detail="Assinatura Mercado Pago invalida.")


@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return use_cases(db).list_plans()


@router.get("/config")
def billing_config(db: Session = Depends(get_db)):
    return use_cases(db).config()


@router.get("/me")
def billing_me(user_id: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    try:
        return use_cases(db).user_billing(user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/checkout/pix", response_model=PaymentOut)
def checkout_pix(payload: CheckoutPixRequest, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    try:
        return use_cases(db).create_pix_checkout(payload.user_id, payload.plan_code)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/checkout/card", response_model=PaymentOut)
def checkout_card(payload: CheckoutCardRequest, db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(payload.user_id, authenticated_user_id)
    try:
        return use_cases(db).create_card_checkout(payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/payments/{payment_id}/expire", response_model=PaymentOut)
def expire_payment(payment_id: str, user_id: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    try:
        return use_cases(db).expire_payment(user_id, payment_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/payments/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: str, user_id: str = Query(...), db: Session = Depends(get_db), authenticated_user_id: str = Depends(require_auth_user)):
    assert_user_access(user_id, authenticated_user_id)
    try:
        return use_cases(db).get_payment(user_id, payment_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/webhooks/mercadopago")
async def mercadopago_webhook(
    request: Request,
    db: Session = Depends(get_db),
    id: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    type: str | None = Query(default=None),
    data_id: str | None = Query(default=None, alias="data.id"),
):
    try:
        try:
            payload = await request.json()
        except ValueError:
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        if id and "id" not in payload:
            payload["id"] = id
        if topic and "topic" not in payload:
            payload["topic"] = topic
        if type and "type" not in payload:
            payload["type"] = type
        if data_id:
            data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
            data.setdefault("id", data_id)
            payload["data"] = data
        provider_payment_id = str((payload.get("data") or {}).get("id") or payload.get("id") or "")
        validate_mercado_pago_signature(request, provider_payment_id)
        return use_cases(db).process_webhook(payload)
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
