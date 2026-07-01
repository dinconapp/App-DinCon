import re
import unicodedata


CONFIRM_WORDS = {"1", "sim", "s", "confirmar", "confirma", "ok"}
CANCEL_WORDS = {"3", "nao", "não", "n", "cancelar", "cancela"}
CORRECT_WORDS = {"2", "corrigir", "corrige"}


def normalize_phone(phone_number: str) -> str:
    raw = phone_number.strip()
    if raw.startswith("whatsapp:"):
        raw = raw.removeprefix("whatsapp:")
    digits = re.sub(r"\D", "", raw)
    if len(digits) < 10 or len(digits) > 15:
        raise ValueError("Telefone invalido. Use formato internacional, exemplo: +5511999999999.")
    return f"whatsapp:+{digits}"


def normalize_phone_e164(phone_number: str) -> str:
    raw = phone_number.strip()
    if raw.startswith("whatsapp:"):
        raw = raw.removeprefix("whatsapp:")
    digits = re.sub(r"\D", "", raw)
    if len(digits) < 10 or len(digits) > 15:
        raise ValueError("Telefone invalido. Use formato internacional, exemplo: +5511999999999.")
    return f"+{digits}"


def normalize_user_reply(text: str | None) -> str:
    if not text:
        return ""
    value = text.strip().lower()
    value = "".join(ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn")
    return value


def classify_confirmation_reply(text: str | None) -> str | None:
    normalized = normalize_user_reply(text)
    if normalized in {normalize_user_reply(word) for word in CONFIRM_WORDS}:
        return "confirm"
    if normalized in {normalize_user_reply(word) for word in CANCEL_WORDS}:
        return "cancel"
    if normalized in {normalize_user_reply(word) for word in CORRECT_WORDS}:
        return "correct"
    return None
