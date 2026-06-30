import logging

from twilio.base.exceptions import TwilioRestException
from twilio.http.http_client import TwilioHttpClient
from twilio.rest import Client

from app.core.config import get_settings
from app.domain.auth.entities import VerifyCheckResult, VerifyStartResult
from app.domain.auth.services import AuthError

logger = logging.getLogger(__name__)


class TwilioEmailVerifyProvider:
    request_timeout_seconds = 20.0

    def __init__(self):
        self.settings = get_settings()

    def _client(self) -> Client:
        if not self.settings.twilio_account_sid or not self.settings.twilio_auth_token:
            raise AuthError("Twilio nao esta configurado para enviar verificacao por SMS.", "verify_not_configured", 503)
        if not self.settings.twilio_verify_service_sid:
            raise AuthError("Twilio Verify Service SID nao configurado.", "verify_not_configured", 503)
        return Client(
            self.settings.twilio_account_sid,
            self.settings.twilio_auth_token,
            http_client=TwilioHttpClient(timeout=self.request_timeout_seconds),
        )

    def start_email_verification(self, email: str) -> VerifyStartResult:
        return self.start_sms_verification(email)

    def check_email_verification(self, email: str, code: str) -> VerifyCheckResult:
        return self.check_sms_verification(email, code)

    def start_sms_verification(self, phone_number: str) -> VerifyStartResult:
        to = normalize_verify_phone(phone_number)
        try:
            verification = self._client().verify.v2.services(self.settings.twilio_verify_service_sid).verifications.create(
                to=to,
                channel=self.settings.twilio_verify_channel or self.settings.twilio_verify_sms_channel or "sms",
            )
            logger.info("twilio.verify.sms.started phone=%s status=%s", _mask_phone(to), verification.status)
            return VerifyStartResult(status=verification.status, provider_verification_sid=getattr(verification, "sid", None))
        except TwilioRestException as exc:
            logger.warning("twilio.verify.sms.start.failed phone=%s code=%s status=%s", _mask_phone(to), exc.code, exc.status)
            raise AuthError(_friendly_twilio_message(exc), "verify_provider_error", 503)
        except Exception:
            logger.exception("twilio.verify.sms.start.failed phone=%s", _mask_phone(to))
            raise AuthError("Nao foi possivel enviar ou validar o codigo de verificacao. Tente novamente.", "verify_provider_error", 503)

    def check_sms_verification(self, phone_number: str, code: str) -> VerifyCheckResult:
        to = normalize_verify_phone(phone_number)
        try:
            check = self._client().verify.v2.services(self.settings.twilio_verify_service_sid).verification_checks.create(
                to=to,
                code=code,
            )
            approved = check.status == "approved"
            logger.info("twilio.verify.sms.checked phone=%s status=%s", _mask_phone(to), check.status)
            return VerifyCheckResult(status=check.status, approved=approved)
        except TwilioRestException as exc:
            logger.warning("twilio.verify.sms.check.failed phone=%s code=%s status=%s", _mask_phone(to), exc.code, exc.status)
            raise AuthError(_friendly_twilio_message(exc), "invalid_or_expired_code", 400)
        except Exception:
            logger.exception("twilio.verify.sms.check.failed phone=%s", _mask_phone(to))
            raise AuthError("Nao foi possivel enviar ou validar o codigo de verificacao. Tente novamente.", "verify_provider_error", 503)


def _mask_email(email: str) -> str:
    name, _, domain = email.partition("@")
    return f"{name[:2]}***@{domain}" if domain else "***"


def normalize_verify_phone(phone_number: str) -> str:
    value = phone_number.strip()
    if value.startswith("whatsapp:"):
        value = value.replace("whatsapp:", "", 1)
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) == 11 and not digits.startswith("55"):
        digits = f"55{digits}"
    if not digits:
        raise AuthError("Celular invalido para verificacao por SMS.", "invalid_phone", 400)
    return f"+{digits}"


def _mask_phone(phone_number: str) -> str:
    digits = "".join(ch for ch in phone_number if ch.isdigit())
    return f"...{digits[-4:]}" if digits else "..."


def _friendly_twilio_message(exc: TwilioRestException) -> str:
    if exc.status in {401, 403}:
        return "Credenciais da Twilio invalidas ou sem permissao para Verify."
    if exc.status == 404:
        return "Servico Twilio Verify nao encontrado. Confira TWILIO_VERIFY_SERVICE_SID."
    if exc.status == 429:
        return "Limite de tentativas atingido. Tente novamente mais tarde."
    return "Nao foi possivel enviar ou validar o codigo de verificacao. Confira a configuracao do Twilio Verify SMS."
