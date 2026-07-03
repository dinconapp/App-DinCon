from datetime import date

from app.application.common import model_to_dict
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domain.users.services import user_initial


USER_FIELDS = ["id", "name", "email", "phone", "initial", "initial_balance", "base_month", "active", "email_verified", "verification_status"]
ADDRESS_FIELDS = ["zip_code", "address_number", "residence_type", "street_name", "neighborhood", "city", "federal_unit", "complement"]


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


def split_address_data(data: dict) -> tuple[dict, dict]:
    user_data = dict(data)
    address_data = {}
    for field in ADDRESS_FIELDS:
        if field in user_data:
            address_data[field] = user_data.pop(field)
    return user_data, address_data


def serialize_user_profile(user) -> dict:
    data = model_to_dict(user, USER_FIELDS)
    address = getattr(user, "address", None)
    if address:
        address_data = model_to_dict(address, ADDRESS_FIELDS)
        data.update(address_data)
    else:
        for field in ADDRESS_FIELDS:
            data[field] = None
    return data


class UserUseCases:
    def __init__(self, users):
        self.users = users

    def get_profile(self, user_id: str):
        user = self.users.get(user_id)
        stats = self.users.stats(user_id)
        return serialize_user_profile(user) | stats

    def get_profile_by_email(self, email: str):
        user = self.users.get_by_email(email)
        stats = self.users.stats(user.id)
        return serialize_user_profile(user) | stats

    def create_profile(self, payload):
        data = payload.model_dump()
        data["email"] = data["email"].strip().lower()
        try:
            self.users.get_by_email(data["email"])
            raise BusinessRuleError("Este e-mail ja esta cadastrado.")
        except NotFoundError:
            pass
        data["phone"] = data.get("phone") or None
        user_data, address_data = split_address_data(data)
        user_data["initial"] = user_initial(user_data["name"])
        user_data["base_month"] = user_data.get("base_month") or date.today().strftime("%Y-%m")
        user = self.users.create(user_data)
        address_data["zip_code"] = normalize_cep(address_data.get("zip_code"))
        address_data["address_number"] = clean_text(address_data.get("address_number"))
        address_data["residence_type"] = clean_text(address_data.get("residence_type"))
        address_data["street_name"] = clean_text(address_data.get("street_name"))
        address_data["neighborhood"] = clean_text(address_data.get("neighborhood"))
        address_data["city"] = clean_text(address_data.get("city"))
        address_data["federal_unit"] = clean_text(address_data.get("federal_unit"))
        address_data["complement"] = clean_text(address_data.get("complement"))
        if any(value is not None for value in address_data.values()):
            self.users.upsert_address(user.id, address_data)
        stats = self.users.stats(user.id)
        return serialize_user_profile(user) | stats

    def update_profile(self, user_id: str, payload):
        data = payload.model_dump(exclude_none=True)
        user_data, address_data = split_address_data(data)
        if "phone" in user_data:
            user_data["phone"] = user_data.get("phone") or None
        user_data["initial"] = user_initial(user_data["name"])
        user = self.users.update(user_id, user_data)
        if address_data:
            address_data["zip_code"] = normalize_cep(address_data.get("zip_code"))
            address_data["address_number"] = clean_text(address_data.get("address_number"))
            address_data["residence_type"] = clean_text(address_data.get("residence_type"))
            address_data["street_name"] = clean_text(address_data.get("street_name"))
            address_data["neighborhood"] = clean_text(address_data.get("neighborhood"))
            address_data["city"] = clean_text(address_data.get("city"))
            address_data["federal_unit"] = clean_text(address_data.get("federal_unit"))
            address_data["complement"] = clean_text(address_data.get("complement"))
            self.users.upsert_address(user_id, address_data)
        stats = self.users.stats(user_id)
        return serialize_user_profile(user) | stats
