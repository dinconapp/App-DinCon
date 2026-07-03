from datetime import date

from app.application.common import model_to_dict
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domain.users.services import user_initial


USER_FIELDS = ["id", "name", "email", "phone", "zip_code", "address_number", "residence_type", "street_name", "neighborhood", "city", "federal_unit", "complement", "initial", "initial_balance", "base_month", "active", "email_verified", "verification_status"]


def normalize_cep(value: str | None) -> str | None:
    if value is None:
        return None
    digits = "".join(ch for ch in str(value) if ch.isdigit())[:8]
    if len(digits) != 8:
        return None
    return f"{digits[:5]}-{digits[5:]}"


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


class UserUseCases:
    def __init__(self, users):
        self.users = users

    def get_profile(self, user_id: str):
        user = self.users.get(user_id)
        stats = self.users.stats(user_id)
        return model_to_dict(user, USER_FIELDS) | stats

    def get_profile_by_email(self, email: str):
        user = self.users.get_by_email(email)
        stats = self.users.stats(user.id)
        return model_to_dict(user, USER_FIELDS) | stats

    def create_profile(self, payload):
        data = payload.model_dump()
        data["email"] = data["email"].strip().lower()
        try:
            self.users.get_by_email(data["email"])
            raise BusinessRuleError("Este e-mail ja esta cadastrado.")
        except NotFoundError:
            pass
        data["phone"] = data.get("phone") or None
        data["zip_code"] = normalize_cep(data.get("zip_code"))
        data["address_number"] = (data.get("address_number") or None)
        data["residence_type"] = (data.get("residence_type") or None)
        data["street_name"] = clean_text(data.get("street_name"))
        data["neighborhood"] = clean_text(data.get("neighborhood"))
        data["city"] = clean_text(data.get("city"))
        data["federal_unit"] = clean_text(data.get("federal_unit"))
        data["complement"] = clean_text(data.get("complement"))
        data["initial"] = user_initial(data["name"])
        data["base_month"] = data.get("base_month") or date.today().strftime("%Y-%m")
        user = self.users.create(data)
        stats = self.users.stats(user.id)
        return model_to_dict(user, USER_FIELDS) | stats

    def update_profile(self, user_id: str, payload):
        data = payload.model_dump(exclude_none=True)
        if "zip_code" in data:
            data["zip_code"] = normalize_cep(data.get("zip_code"))
        if "address_number" in data:
            data["address_number"] = data.get("address_number") or None
        if "residence_type" in data:
            data["residence_type"] = data.get("residence_type") or None
        if "street_name" in data:
            data["street_name"] = clean_text(data.get("street_name"))
        if "neighborhood" in data:
            data["neighborhood"] = clean_text(data.get("neighborhood"))
        if "city" in data:
            data["city"] = clean_text(data.get("city"))
        if "federal_unit" in data:
            data["federal_unit"] = clean_text(data.get("federal_unit"))
        if "complement" in data:
            data["complement"] = clean_text(data.get("complement"))
        data["initial"] = user_initial(data["name"])
        user = self.users.update(user_id, data)
        stats = self.users.stats(user_id)
        return model_to_dict(user, USER_FIELDS) | stats
