from datetime import date

from app.application.common import model_to_dict
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domain.users.services import user_initial


USER_FIELDS = ["id", "name", "email", "phone", "initial", "initial_balance", "base_month", "active", "email_verified", "verification_status"]


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
        data["initial"] = user_initial(data["name"])
        data["base_month"] = data.get("base_month") or date.today().strftime("%Y-%m")
        user = self.users.create(data)
        stats = self.users.stats(user.id)
        return model_to_dict(user, USER_FIELDS) | stats

    def update_profile(self, user_id: str, payload):
        data = payload.model_dump(exclude_none=True)
        data["initial"] = user_initial(data["name"])
        user = self.users.update(user_id, data)
        stats = self.users.stats(user_id)
        return model_to_dict(user, USER_FIELDS) | stats
