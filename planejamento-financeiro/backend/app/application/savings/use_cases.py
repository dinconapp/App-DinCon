from decimal import Decimal
from app.application.common import model_to_dict
from app.domain.savings.services import project_investment


INVESTMENT_FIELDS = [
    "id", "user_id", "name", "description", "initial_amount", "monthly_contribution",
    "interest_type", "interest_rate", "interest_period", "start_month", "end_month", "active",
]


def serialize_investment(investment):
    return model_to_dict(investment, INVESTMENT_FIELDS)


def serialize_point(point):
    return {
        "month_key": point.month_key,
        "month_label": point.month_label,
        "invested_amount": float(point.invested_amount),
        "interest_amount": float(point.interest_amount),
        "projected_balance": float(point.projected_balance),
        "monthly_contribution": float(point.monthly_contribution),
        "accumulated_contributions": float(point.accumulated_contributions),
        "accumulated_interest": float(point.accumulated_interest),
    }


class SavingsUseCases:
    def __init__(self, savings, users):
        self.savings = savings
        self.users = users

    def list_investments(self, user_id: str):
        self.users.get(user_id)
        return [serialize_investment(row) for row in self.savings.list_by_user(user_id)]

    def get_investment(self, investment_id: str):
        return serialize_investment(self.savings.get(investment_id))

    def create_investment(self, payload):
        self.users.get(payload.user_id)
        return serialize_investment(self.savings.create(payload.model_dump()))

    def update_investment(self, investment_id: str, payload):
        return serialize_investment(self.savings.update(investment_id, payload.model_dump()))

    def delete_investment(self, investment_id: str):
        self.savings.deactivate(investment_id)
        return {"deleted": True}

    def investment_projection(self, investment_id: str, months: int):
        investment = self.savings.get(investment_id)
        return [serialize_point(point) for point in project_investment(investment, months)]

    def consolidated_projection(self, user_id: str, months: int):
        self.users.get(user_id)
        rows = self.savings.list_by_user(user_id)
        return self._consolidate(rows, months)["projection"]

    def dashboard(self, user_id: str, months: int):
        self.users.get(user_id)
        rows = self.savings.list_by_user(user_id)
        consolidated = self._consolidate(rows, months)
        projection = consolidated["projection"]
        last = projection[-1] if projection else None
        projected_balance = last["projected_balance"] if last else 0
        invested_total = last["accumulated_contributions"] if last else 0
        projected_interest = last["accumulated_interest"] if last else 0
        best_projection = max(consolidated["by_investment"], key=lambda item: item["projected_balance"], default=None)
        return {
            "total_invested_now": float(sum((Decimal(row.initial_amount) for row in rows), Decimal("0"))),
            "projected_balance": projected_balance,
            "total_monthly_contribution": float(sum((Decimal(row.monthly_contribution) for row in rows), Decimal("0"))),
            "projected_interest": projected_interest,
            "investments_count": len(rows),
            "best_projection": best_projection,
            "projection": projection,
            "investments": [serialize_investment(row) for row in rows],
        }

    def _consolidate(self, investments, months: int):
        totals: dict[str, dict] = {}
        by_investment = []
        for investment in investments:
            points = project_investment(investment, months)
            if points:
                by_investment.append({
                    "id": investment.id,
                    "name": investment.name,
                    "projected_balance": float(points[-1].projected_balance),
                    "accumulated_interest": float(points[-1].accumulated_interest),
                })
            for point in points:
                row = totals.setdefault(point.month_key, {
                    "month_key": point.month_key,
                    "month_label": point.month_label,
                    "invested_amount": 0.0,
                    "interest_amount": 0.0,
                    "projected_balance": 0.0,
                    "monthly_contribution": 0.0,
                    "accumulated_contributions": 0.0,
                    "accumulated_interest": 0.0,
                })
                row["invested_amount"] += float(point.invested_amount)
                row["interest_amount"] += float(point.interest_amount)
                row["projected_balance"] += float(point.projected_balance)
                row["monthly_contribution"] += float(point.monthly_contribution)
                row["accumulated_contributions"] += float(point.accumulated_contributions)
                row["accumulated_interest"] += float(point.accumulated_interest)
        return {"projection": [totals[key] for key in sorted(totals)], "by_investment": by_investment}
