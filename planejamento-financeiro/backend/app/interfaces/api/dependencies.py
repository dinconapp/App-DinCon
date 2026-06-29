from sqlalchemy.orm import Session
from app.core.database import get_db
from app.infrastructure.db.repositories.billing_repository_sqlalchemy import SqlAlchemyBillingRepository
from app.infrastructure.db.repositories.auth_user_repository_sqlalchemy import SqlAlchemyAuthUserRepository
from app.infrastructure.db.repositories.budget_repository_sqlalchemy import SqlAlchemyBudgetRepository
from app.infrastructure.db.repositories.category_repository_sqlalchemy import SqlAlchemyCategoryRepository
from app.infrastructure.db.repositories.email_verification_repository_sqlalchemy import SqlAlchemyEmailVerificationRepository
from app.infrastructure.db.repositories.savings_repository_sqlalchemy import SqlAlchemySavingsInvestmentRepository
from app.infrastructure.db.repositories.transaction_repository_sqlalchemy import SqlAlchemyTransactionRepository
from app.infrastructure.db.repositories.user_repository_sqlalchemy import SqlAlchemyUserRepository
from app.infrastructure.db.repositories.whatsapp_account_repository_sqlalchemy import SqlAlchemyWhatsAppAccountRepository
from app.infrastructure.db.repositories.whatsapp_message_repository_sqlalchemy import SqlAlchemyWhatsAppMessageRepository
from app.infrastructure.db.repositories.whatsapp_transaction_draft_repository_sqlalchemy import SqlAlchemyWhatsAppTransactionDraftRepository


def repositories(db: Session):
    return {
        "users": SqlAlchemyUserRepository(db),
        "auth_users": SqlAlchemyAuthUserRepository(db),
        "email_verifications": SqlAlchemyEmailVerificationRepository(db),
        "billing": SqlAlchemyBillingRepository(db),
        "categories": SqlAlchemyCategoryRepository(db),
        "budgets": SqlAlchemyBudgetRepository(db),
        "transactions": SqlAlchemyTransactionRepository(db),
        "savings": SqlAlchemySavingsInvestmentRepository(db),
        "whatsapp_accounts": SqlAlchemyWhatsAppAccountRepository(db),
        "whatsapp_messages": SqlAlchemyWhatsAppMessageRepository(db),
        "whatsapp_drafts": SqlAlchemyWhatsAppTransactionDraftRepository(db),
    }
