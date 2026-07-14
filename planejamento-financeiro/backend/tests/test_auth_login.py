import unittest
from datetime import datetime
from types import SimpleNamespace

from app.application.auth.use_cases import AuthUseCases


class FakeUsersRepo:
    def __init__(self, user):
        self.user = user
        self.updated_payloads = []

    def get_by_email_or_none(self, email: str):
        if email != self.user.email:
            return None
        return self.user

    def update(self, user_id: str, data: dict):
        self.updated_payloads.append((user_id, data))
        raise RuntimeError("column missing")


class FakeHasher:
    def verify(self, password: str, password_hash: str | None):
        return password == "secret" and password_hash == "hash"


class FakeCipher:
    def decrypt_if_needed(self, value: str):
        return value


class FakeJwtProvider:
    def create_access_token(self, user_id: str):
        return f"token-{user_id}"


class FakeVerifyProvider:
    settings = SimpleNamespace(twilio_verify_service_sid="srv_1")


class AuthLoginTests(unittest.TestCase):
    def test_login_ignores_last_login_update_failure(self):
        user = SimpleNamespace(
            id="user_1",
            email="user@example.com",
            password_hash="hash",
            active=True,
            email_verified=True,
            name="Usuário",
        )
        use_cases = AuthUseCases(
            FakeUsersRepo(user),
            SimpleNamespace(),
            FakeHasher(),
            FakeCipher(),
            FakeJwtProvider(),
            FakeVerifyProvider(),
        )

        result = use_cases.login(SimpleNamespace(email="user@example.com", password="secret"))

        self.assertEqual(result["access_token"], "token-user_1")
        self.assertEqual(result["user"]["id"], "user_1")
        self.assertTrue(result["user"]["active"])
        self.assertEqual(len(use_cases.users.updated_payloads), 1)
        self.assertIsInstance(use_cases.users.updated_payloads[0][1]["last_login_at"], datetime)


if __name__ == "__main__":
    unittest.main()
