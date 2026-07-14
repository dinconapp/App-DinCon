from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import NotFoundError
from app.domain.shared import date_range_for_month
from app.infrastructure.db.models import TransactionModel, WhatsAppTransactionDraftModel


class SqlAlchemyTransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, transaction_id: str) -> TransactionModel:
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(TransactionModel.id == transaction_id)
        )
        tx = self.db.scalar(stmt)
        if not tx:
            raise NotFoundError("Transacao nao encontrada.")
        return tx

    def get_by_id_and_user_id(self, transaction_id: str, user_id: str) -> TransactionModel:
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(TransactionModel.id == transaction_id, TransactionModel.user_id == user_id)
        )
        tx = self.db.scalar(stmt)
        if not tx:
            raise NotFoundError("Transacao nao encontrada.")
        return tx

    def get_by_budget_id_and_user_id(self, budget_id: str, user_id: str) -> TransactionModel | None:
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(TransactionModel.budget_id == budget_id, TransactionModel.user_id == user_id)
            .order_by(TransactionModel.created_at.desc(), TransactionModel.updated_at.desc())
        )
        return self.db.scalar(stmt)

    def get_by_budget_id_and_user_id_month(self, budget_id: str, user_id: str, month_key: str) -> TransactionModel | None:
        start, end = date_range_for_month(month_key)
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(
                TransactionModel.budget_id == budget_id,
                TransactionModel.user_id == user_id,
                TransactionModel.transaction_date >= start,
                TransactionModel.transaction_date < end,
            )
            .order_by(TransactionModel.created_at.desc(), TransactionModel.updated_at.desc())
        )
        return self.db.scalar(stmt)

    def list_by_user_month(self, user_id: str, month_key: str, filters: dict | None = None):
        start, end = date_range_for_month(month_key)
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(
                TransactionModel.user_id == user_id,
                TransactionModel.transaction_date >= start,
                TransactionModel.transaction_date < end,
            )
            .order_by(TransactionModel.transaction_date.desc(), TransactionModel.created_at.desc())
        )
        filters = filters or {}
        if filters.get("kind"):
            stmt = stmt.where(TransactionModel.kind == filters["kind"])
        if filters.get("category_id"):
            stmt = stmt.where(TransactionModel.category_id == filters["category_id"])
        if filters.get("search"):
            stmt = stmt.where(TransactionModel.title.ilike(f"%{filters['search']}%"))
        return list(self.db.scalars(stmt))

    def list_between_months(self, user_id: str, start_month: str, end_month: str):
        start, _ = date_range_for_month(start_month)
        _, end = date_range_for_month(end_month)
        stmt = (
            select(TransactionModel)
            .options(joinedload(TransactionModel.category), joinedload(TransactionModel.budget))
            .where(TransactionModel.user_id == user_id, TransactionModel.transaction_date >= start, TransactionModel.transaction_date < end)
        )
        return list(self.db.scalars(stmt))

    def create(self, data: dict) -> TransactionModel:
        try:
            tx = TransactionModel(**data)
            self.db.add(tx)
            self.db.commit()
            return self.get(tx.id)
        except Exception:
            self.db.rollback()
            raise

    def update(self, transaction_id: str, data: dict) -> TransactionModel:
        try:
            tx = self.get(transaction_id)
            for key, value in data.items():
                setattr(tx, key, value)
            self.db.commit()
            return self.get(transaction_id)
        except Exception:
            self.db.rollback()
            raise

    def delete(self, transaction_id: str, commit: bool = True) -> None:
        try:
            tx = self.get(transaction_id)
            self._unlink_whatsapp_drafts(transaction_id)
            self.db.delete(tx)
            if commit:
                self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def count_by_budget_id(self, budget_id: str, user_id: str) -> int:
        stmt = select(func.count(TransactionModel.id)).where(
            TransactionModel.user_id == user_id,
            TransactionModel.budget_id == budget_id,
        )
        return int(self.db.scalar(stmt) or 0)

    def delete_by_budget_id(self, budget_id: str, user_id: str) -> int:
        try:
            transaction_ids = list(self.db.scalars(
                select(TransactionModel.id).where(
                    TransactionModel.user_id == user_id,
                    TransactionModel.budget_id == budget_id,
                )
            ))
            for transaction_id in transaction_ids:
                self._unlink_whatsapp_drafts(transaction_id)
            if transaction_ids:
                self.db.query(TransactionModel).filter(
                    TransactionModel.user_id == user_id,
                    TransactionModel.budget_id == budget_id,
                ).delete(synchronize_session=False)
            return len(transaction_ids)
        except Exception:
            self.db.rollback()
            raise

    def delete_paid_bill(self, user_id: str, budget_id: str, month_key: str) -> None:
        start, end = date_range_for_month(month_key)
        try:
            rows = list(self.db.scalars(
                select(TransactionModel.id).where(
                    TransactionModel.user_id == user_id,
                    TransactionModel.budget_id == budget_id,
                    TransactionModel.status == "paid",
                    TransactionModel.transaction_date >= start,
                    TransactionModel.transaction_date < end,
                )
            ))
            for transaction_id in rows:
                self._unlink_whatsapp_drafts(transaction_id)
            self.db.query(TransactionModel).filter(
                TransactionModel.user_id == user_id,
                TransactionModel.budget_id == budget_id,
                TransactionModel.status == "paid",
                TransactionModel.transaction_date >= start,
                TransactionModel.transaction_date < end,
            ).delete()
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _unlink_whatsapp_drafts(self, transaction_id: str) -> None:
        self.db.execute(
            update(WhatsAppTransactionDraftModel)
            .where(WhatsAppTransactionDraftModel.created_transaction_id == transaction_id)
            .values(created_transaction_id=None)
        )
