from app.application.common import model_to_dict


SUGGESTION_FIELDS = ["id", "user_id", "title", "message", "status", "created_at", "updated_at"]


def serialize_suggestion(suggestion):
    return model_to_dict(suggestion, SUGGESTION_FIELDS)


class SuggestionUseCases:
    def __init__(self, suggestions, users):
        self.suggestions = suggestions
        self.users = users

    def list(self, user_id: str):
        self.users.get(user_id)
        return [serialize_suggestion(suggestion) for suggestion in self.suggestions.list_by_user(user_id)]

    def create(self, payload):
        self.users.get(payload.user_id)
        suggestion = self.suggestions.create({
            "user_id": payload.user_id,
            "title": payload.title.strip(),
            "message": payload.message.strip(),
            "status": "open",
        })
        return serialize_suggestion(suggestion)
