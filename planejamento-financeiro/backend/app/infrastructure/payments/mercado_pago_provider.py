import logging
from datetime import datetime

import requests

from app.core.config import get_settings
from app.domain.billing.services import BillingError

logger = logging.getLogger(__name__)


class MercadoPagoProvider:
    provider_name = "mercadopago"

    def __init__(self):
        self.settings = get_settings()

    def configured(self) -> bool:
        token = self.settings.mercado_pago_access_token.strip()
        return bool(token)

    def create_payment(self, payload: dict) -> dict:
        self._validate_credentials()
        url = f"{self.settings.mercado_pago_api_base_url.rstrip('/')}/v1/payments"
        logger.info("mercadopago.payment.create.start method=%s external_reference=%s", payload.get("payment_method_id"), payload.get("external_reference"))
        response = requests.post(url, headers=self._headers(), json=payload, timeout=40)
        if response.status_code >= 400:
            logger.warning("mercadopago.payment.create.failed status=%s body=%s", response.status_code, response.text[:600])
            raise BillingError(f"Mercado Pago recusou a criacao do pagamento. {self._detail(response)}", status_code=502)
        data = response.json()
        logger.info("mercadopago.payment.create.success provider_payment_id=%s status=%s", data.get("id"), data.get("status"))
        return data

    def get_payment(self, provider_payment_id: str) -> dict:
        self._validate_credentials()
        url = f"{self.settings.mercado_pago_api_base_url.rstrip('/')}/v1/payments/{provider_payment_id}"
        response = requests.get(url, headers=self._headers(), timeout=30)
        if response.status_code >= 400:
            logger.warning("mercadopago.payment.get.failed status=%s provider_payment_id=%s body=%s", response.status_code, provider_payment_id, response.text[:600])
            raise BillingError(f"Nao foi possivel consultar o pagamento no Mercado Pago. {self._detail(response)}", status_code=502)
        return response.json()

    def build_notification_url(self) -> str | None:
        base = (self.settings.api_public_url or "").rstrip("/")
        return f"{base}/api/billing/webhooks/mercadopago" if base else None

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.settings.mercado_pago_access_token}",
            "Content-Type": "application/json",
            "X-Idempotency-Key": str(int(datetime.utcnow().timestamp() * 1000000)),
        }

    def _validate_credentials(self) -> None:
        if not self.configured():
            raise BillingError("Credencial do Mercado Pago nao configurada.", status_code=503)
        if self.settings.mercado_pago_access_token.strip() == self.settings.mercado_pago_public_key.strip():
            raise BillingError("Credenciais do Mercado Pago configuradas incorretamente.", status_code=503)

    def _detail(self, response: requests.Response) -> str:
        try:
            data = response.json()
        except ValueError:
            return response.text[:240]
        return str(data.get("message") or data.get("error") or data)[:300]
