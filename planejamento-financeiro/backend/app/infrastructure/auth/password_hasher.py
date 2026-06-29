import base64
import hashlib
import hmac
import secrets


class PasswordHasher:
    def hash(self, password: str) -> str:
        salt = secrets.token_bytes(16)
        rounds = 260000
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, rounds)
        return f"pbkdf2_sha256${rounds}${_b64(salt)}${_b64(digest)}"

    def verify(self, password: str, password_hash: str | None) -> bool:
        if not password_hash:
            return False
        try:
            algorithm, rounds, salt, expected = password_hash.split("$", 3)
            if algorithm != "pbkdf2_sha256":
                return False
            digest = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(salt), int(rounds))
            return hmac.compare_digest(_b64(digest), expected)
        except Exception:
            return False


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("ascii"))
