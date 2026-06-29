class AuthError(Exception):
    def __init__(self, message: str, status: str = "auth_error", status_code: int = 400):
        super().__init__(message)
        self.status = status
        self.status_code = status_code


def normalize_email(email: str) -> str:
    return email.strip().lower()
