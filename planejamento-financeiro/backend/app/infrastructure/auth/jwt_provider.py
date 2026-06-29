import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings


class JwtProvider:
    def __init__(self):
        self.settings = get_settings()

    def create_access_token(self, user_id: str) -> str:
        expires = datetime.now(timezone.utc) + timedelta(minutes=self.settings.jwt_access_token_expire_minutes)
        payload = {"sub": user_id, "exp": int(expires.timestamp())}
        return _encode(payload, self.settings.jwt_secret_key)

    def subject(self, token: str) -> str | None:
        try:
            payload = _decode(token, self.settings.jwt_secret_key)
            if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
                return None
            return payload.get("sub")
        except Exception:
            return None


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _encode(payload: dict, secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_part = _b64(json.dumps(header, separators=(",", ":")).encode())
    payload_part = _b64(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_part}.{payload_part}".encode()
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    return f"{header_part}.{payload_part}.{_b64(signature)}"


def _decode(token: str, secret: str) -> dict:
    header_part, payload_part, signature_part = token.split(".")
    signing_input = f"{header_part}.{payload_part}".encode()
    expected = _b64(hmac.new(secret.encode(), signing_input, hashlib.sha256).digest())
    if not hmac.compare_digest(expected, signature_part):
        raise ValueError("Invalid signature")
    return json.loads(_unb64(payload_part))
