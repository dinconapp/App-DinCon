from types import SimpleNamespace

import bcrypt as _bcrypt

if not hasattr(_bcrypt, "__about__"):
    _bcrypt.__about__ = SimpleNamespace(__version__=getattr(_bcrypt, "__version__", "4.2.1"))

from passlib.context import CryptContext


class PasswordHasher:
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash(self, password: str) -> str:
        return self._pwd_context.hash(password)

    def verify(self, password: str, password_hash: str | None) -> bool:
        if not password_hash:
            return False
        try:
            return self._pwd_context.verify(password, password_hash)
        except Exception:
            return False
