from datetime import date, datetime
import logging

from app.domain.auth.services import AuthError, normalize_email
from app.domain.users.services import user_initial

logger = logging.getLogger(__name__)


class AuthUseCases:
    def __init__(self, users, attempts, hasher, jwt_provider, verify_provider):
        self.users = users
        self.attempts = attempts
        self.hasher = hasher
        self.jwt = jwt_provider
        self.verify = verify_provider

    def register(self, payload):
        email = normalize_email(str(payload.email))
        phone = payload.phone
        user = self.users.get_by_email_or_none(email)
        if user and user.email_verified:
            raise AuthError("Este e-mail ja esta cadastrado.", "email_already_registered", 409)

        now = datetime.utcnow()
        if not user:
            user = self.users.create_pending({
                "name": payload.name.strip(),
                "email": email,
                "phone": phone,
                "password_hash": self.hasher.hash(payload.password),
                "active": False,
                "email_verified": False,
                "verification_status": "pending",
                "verification_started_at": now,
                "initial": user_initial(payload.name),
                "initial_balance": 0,
                "base_month": date.today().strftime("%Y-%m"),
            })
        else:
            user = self.users.update(user.id, {
                "name": payload.name.strip(),
                "password_hash": self.hasher.hash(payload.password),
                "phone": phone,
                "active": False,
                "email_verified": False,
                "verification_status": "pending",
                "verification_started_at": now,
                "initial": user_initial(payload.name),
            })

        result = self.verify.start_sms_verification(phone)
        logger.info("auth.verify.registration.sms_sent user_id=%s email=%s phone=...%s status=%s", user.id, email, phone[-4:], result.status)
        self._record_attempt({
            "user_id": user.id,
            "email": email,
            "phone_number": phone,
            "provider": "twilio",
            "provider_service_sid": self.verify.settings.twilio_verify_service_sid,
            "provider_verification_sid": result.provider_verification_sid,
            "channel": "sms",
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        })
        return {
            "status": "verification_pending",
            "message": "Cadastro iniciado. Enviamos um codigo de verificacao por SMS.",
            "email": email,
        }

    def verify_email(self, payload):
        email = normalize_email(str(payload.email))
        user = self.users.get_by_email_or_none(email)
        if not user:
            raise AuthError("Usuario nao encontrado.", "not_found", 404)
        if user.email_verified:
            return {"status": "approved", "message": "Conta ja verificada."}

        if not user.phone:
            raise AuthError("Usuario sem celular cadastrado para verificacao por SMS.", "phone_not_found", 400)
        result = self.verify.check_sms_verification(user.phone, payload.code)
        attempt = self._latest_pending_attempt(user.id)
        if result.approved:
            now = datetime.utcnow()
            self.users.update(user.id, {
                "active": True,
                "email_verified": True,
                "verification_status": "approved",
                "verified_at": now,
            })
            if attempt:
                self._update_attempt(attempt.id, {"status": "approved", "updated_at": now})
            return {"status": "approved", "message": "Celular verificado com sucesso. Voce ja pode acessar o DinCon."}

        if attempt:
            self._update_attempt(attempt.id, {"status": "failed", "updated_at": datetime.utcnow()})
        self.users.update(user.id, {"verification_status": "failed"})
        raise AuthError("Codigo invalido ou expirado.", "invalid_or_expired_code", 400)

    def resend_email_code(self, payload):
        email = normalize_email(str(payload.email))
        user = self.users.get_by_email_or_none(email)
        if not user:
            raise AuthError("Usuario nao encontrado.", "not_found", 404)
        if user.email_verified:
            return {"status": "already_verified", "message": "Esta conta ja esta verificada."}
        if not user.phone:
            raise AuthError("Usuario sem celular cadastrado para verificacao por SMS.", "phone_not_found", 400)
        result = self.verify.start_sms_verification(user.phone)
        logger.info("auth.verify.resend.sms_sent user_id=%s email=%s phone=...%s status=%s", user.id, email, user.phone[-4:], result.status)
        now = datetime.utcnow()
        self.users.update(user.id, {"verification_status": "pending", "verification_started_at": now})
        self._record_attempt({
            "user_id": user.id,
            "email": email,
            "phone_number": user.phone,
            "provider": "twilio",
            "provider_service_sid": self.verify.settings.twilio_verify_service_sid,
            "provider_verification_sid": result.provider_verification_sid,
            "channel": "sms",
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        })
        return {"status": "pending", "message": "Enviamos um novo codigo de verificacao por SMS."}

    def start_password_reset(self, payload):
        email = normalize_email(str(payload.email))
        user = self.users.get_by_email_or_none(email)
        if not user:
            raise AuthError("E-mail nao encontrado.", "not_found", 404)

        if not user.phone:
            raise AuthError("Usuario sem celular cadastrado para verificacao por SMS.", "phone_not_found", 400)
        result = self.verify.start_sms_verification(user.phone)
        logger.info("auth.verify.password_reset.sms_sent user_id=%s email=%s phone=...%s status=%s", user.id, email, user.phone[-4:], result.status)
        now = datetime.utcnow()
        self.users.update(user.id, {"verification_status": "pending", "verification_started_at": now})
        self._record_attempt({
            "user_id": user.id,
            "email": email,
            "phone_number": user.phone,
            "provider": "twilio",
            "provider_service_sid": self.verify.settings.twilio_verify_service_sid,
            "provider_verification_sid": result.provider_verification_sid,
            "channel": "sms",
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        })
        return {"status": "pending", "message": "Enviamos um codigo de verificacao por SMS."}

    def confirm_password_reset(self, payload):
        email = normalize_email(str(payload.email))
        user = self.users.get_by_email_or_none(email)
        if not user:
            raise AuthError("E-mail nao encontrado.", "not_found", 404)

        if not user.phone:
            raise AuthError("Usuario sem celular cadastrado para verificacao por SMS.", "phone_not_found", 400)
        result = self.verify.check_sms_verification(user.phone, payload.code)
        attempt = self._latest_pending_attempt(user.id)
        if not result.approved:
            if attempt:
                self._update_attempt(attempt.id, {"status": "failed", "updated_at": datetime.utcnow()})
            raise AuthError("Codigo invalido ou expirado.", "invalid_or_expired_code", 400)

        now = datetime.utcnow()
        self.users.update(user.id, {
            "password_hash": self.hasher.hash(payload.password),
            "active": True,
            "email_verified": True,
            "verification_status": "approved",
            "verified_at": user.verified_at or now,
        })
        if attempt:
            self._update_attempt(attempt.id, {"status": "approved", "updated_at": now})
        return {"status": "approved", "message": "Senha redefinida com sucesso. Voce ja pode entrar."}

    def login(self, payload):
        email = normalize_email(str(payload.email))
        user = self.users.get_by_email_or_none(email)
        if not user or not self.hasher.verify(payload.password, user.password_hash):
            raise AuthError("E-mail ou senha invalidos.", "invalid_credentials", 401)
        if not user.active or not user.email_verified:
            raise AuthError("Seu celular ainda nao foi verificado por SMS. Informe o codigo enviado ou solicite um novo.", "email_not_verified", 403)
        self.users.update(user.id, {"last_login_at": datetime.utcnow()})
        return {
            "access_token": self.jwt.create_access_token(user.id),
            "token_type": "bearer",
            "user": self._user(user),
        }

    def me(self, user_id: str):
        user = self.users.get(user_id)
        return self._user(user)

    def _user(self, user):
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email or "",
            "email_verified": bool(user.email_verified),
            "active": bool(user.active),
        }

    def _record_attempt(self, data: dict):
        try:
            return self.attempts.create(data)
        except Exception:
            logger.exception("auth.verify.attempt_record_failed user_id=%s channel=%s", data.get("user_id"), data.get("channel"))
            return None

    def _latest_pending_attempt(self, user_id: str):
        try:
            return self.attempts.latest_pending(user_id)
        except Exception:
            logger.exception("auth.verify.attempt_lookup_failed user_id=%s", user_id)
            return None

    def _update_attempt(self, attempt_id: str, data: dict):
        try:
            return self.attempts.update(attempt_id, data)
        except Exception:
            logger.exception("auth.verify.attempt_update_failed attempt_id=%s status=%s", attempt_id, data.get("status"))
            return None
