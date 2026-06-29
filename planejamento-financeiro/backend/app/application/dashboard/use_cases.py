from collections import defaultdict
from app.domain.dashboard.services import dashboard_payload
class DashboardUseCases:
    def __init__(self, users, budgets, transactions):
        self.users = users
        self.budgets = budgets
        self.transactions = transactions

    def get(self, user_id: str, month_key: str):
        user = self.users.get(user_id)
        budget_rows = self.budgets.list_by_user(user_id)
        start_month = min(user.base_month, f"{month_key[:4]}-01")
        end_month = max(month_key, f"{month_key[:4]}-12")
        tx_rows = self.transactions.list_between_months(user_id, start_month, end_month)
        by_month = defaultdict(list)
        for tx in tx_rows:
            by_month[tx.transaction_date.isoformat()[:7]].append(tx)
        return dashboard_payload(user, budget_rows, by_month.get(month_key, []), by_month, month_key)
