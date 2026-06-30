import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from app.core.config import get_settings
from app.domain.auth.services import AuthError


ENCRYPTED_PREFIX = "enc:v1:"


class PasswordCipher:
    def __init__(self):
        self.settings = get_settings()

    def decrypt_if_needed(self, value: str) -> str:
        if value.startswith(ENCRYPTED_PREFIX):
            return self._decrypt(value.removeprefix(ENCRYPTED_PREFIX))
        if self.settings.password_encryption_required:
            raise AuthError("Senha deve ser enviada criptografada.", "password_encryption_required", 400)
        return value

    def _decrypt(self, encrypted_value: str) -> str:
        private_key_pem = self.settings.password_encryption_private_key.strip().replace("\\n", "\n")
        if not private_key_pem:
            raise AuthError("Criptografia de senha nao configurada no servidor.", "password_decryption_not_configured", 503)
        try:
            private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
            ciphertext = base64.b64decode(encrypted_value)
            plaintext = private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )
            return plaintext.decode("utf-8")
        except AuthError:
            raise
        except Exception as exc:
            raise AuthError("Senha criptografada invalida.", "invalid_encrypted_password", 400) from exc
