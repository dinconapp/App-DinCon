from sqlalchemy.orm import Session
from app.infrastructure.db.models import WhatsAppMessageModel


class SqlAlchemyWhatsAppMessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        try:
            message = WhatsAppMessageModel(**data)
            self.db.add(message)
            self.db.commit()
            self.db.refresh(message)
            return message
        except Exception:
            self.db.rollback()
            raise

    def update_transcription(self, message_id: str, transcription: str):
        try:
            message = self.db.get(WhatsAppMessageModel, message_id)
            if message:
                message.transcription = transcription
                self.db.commit()
                self.db.refresh(message)
            return message
        except Exception:
            self.db.rollback()
            raise
