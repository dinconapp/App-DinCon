from app.domain.projections.services import balance_projection, projection_markers


class ProjectionUseCases:
    def __init__(self, users, budgets):
        self.users = users
        self.budgets = budgets

    def balance(self, user_id: str, months: int):
        user = self.users.get(user_id)
        rows = balance_projection(user, self.budgets.list_by_user(user_id), months)
        return {"items": rows, "markers": projection_markers(rows)}
