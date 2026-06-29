from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.application.billing.schemas import CheckoutCardRequest, CheckoutPixRequest, PaymentOut, PlanOut
from app.application.billing.use_cases import BillingUseCases
from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.domain.billing.services import BillingError
from app.infrastructure.payments.mercado_pago_provider import MercadoPagoProvider
from app.interfaces.api.dependencies import repositories

router = APIRouter(prefix="/billing", tags=["billing"])


def use_cases(db: Session):
    repos = repositories(db)
    return BillingUseCases(repos["billing"], repos["users"], MercadoPagoProvider(), get_settings())


@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return use_cases(db).list_plans()


@router.get("/config")
def billing_config(db: Session = Depends(get_db)):
    return use_cases(db).config()


@router.get("/me")
def billing_me(user_id: str = Query(...), db: Session = Depends(get_db)):
    try:
        return use_cases(db).user_billing(user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/checkout/pix", response_model=PaymentOut)
def checkout_pix(payload: CheckoutPixRequest, db: Session = Depends(get_db)):
    try:
        return use_cases(db).create_pix_checkout(payload.user_id, payload.plan_code)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/checkout/card", response_model=PaymentOut)
def checkout_card(payload: CheckoutCardRequest, db: Session = Depends(get_db)):
    try:
        return use_cases(db).create_card_checkout(payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/payments/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: str, user_id: str = Query(...), db: Session = Depends(get_db)):
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
        return use_cases(db).process_webhook(payload)
    except BillingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
