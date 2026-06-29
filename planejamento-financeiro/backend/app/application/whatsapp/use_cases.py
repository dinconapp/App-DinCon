import logging
from datetime import date
from pathlib import Path
from app.application.categories.use_cases import CategoryUseCases
from app.application.common import model_to_dict
from app.domain.whatsapp.services import classify_confirmation_reply, normalize_phone
from app.infrastructure.ai.audio_transcriber import AudioTranscriptionError
from app.infrastructure.ai.transaction_interpreter import AIConfigurationError, TransactionInterpretationError
from app.infrastructure.whatsapp.providers.twilio_provider import TwilioMediaTooLargeError

logger = logging.getLogger(__name__)

ACCOUNT_FIELDS = ["id", "user_id", "phone_number", "provider", "provider_identity", "active", "created_at", "updated_at"]
DRAFT_FIELDS = [
    "id", "user_id", "whatsapp_message_id", "status", "kind", "title", "amount", "category_id",
    "transaction_date", "confidence", "ai_explanation", "original_text", "created_transaction_id", "created_at", "updated_at",
]


def money_br(value) -> str:
    return f"R$ {float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def date_br(value: date) -> str:
    return value.strftime("%d/%m/%Y")


def mask_phone(phone: str | None) -> str:
    if not phone:
        return ""
    return f"...{phone[-4:]}" if len(phone) > 4 else "..."


def serialize_account(account):
    return model_to_dict(account, ACCOUNT_FIELDS)


def serialize_draft(draft):
    return model_to_dict(draft, DRAFT_FIELDS)


class WhatsAppAccountUseCases:
    def __init__(self, accounts, users):
        self.accounts = accounts
        self.users = users

    def list(self, user_id: str):
        self.users.get(user_id)
        return [serialize_account(account) for account in self.accounts.list_by_user(user_id)]

    def create(self, payload):
        self.users.get(payload.user_id)
        account = self.accounts.create({
            "user_id": payload.user_id,
            "phone_number": normalize_phone(payload.phone_number),
            "provider": payload.provider,
            "provider_identity": None,
        })
        return serialize_account(account)

    def deactivate(self, account_id: str):
        self.accounts.deactivate(account_id)
        return {"deleted": True}


class WhatsAppDraftUseCases:
    def __init__(self, drafts, users):
        self.drafts = drafts
        self.users = users

    def list(self, user_id: str, status: str | None = None):
        self.users.get(user_id)
        return [serialize_draft(draft) for draft in self.drafts.list(user_id, status)]


class WhatsAppWebhookUseCases:
    def __init__(self, accounts, messages, drafts, transactions, categories, provider, interpreter, transcriber):
        self.accounts = accounts
        self.messages = messages
        self.drafts = drafts
        self.transactions = transactions
        self.categories = categories
        self.provider = provider
        self.interpreter = interpreter
        self.transcriber = transcriber

    def handle_twilio_webhook(self, form: dict) -> str:
        incoming = self.provider.parse_webhook(form)
        logger.info(
            "whatsapp.webhook.received provider=%s message_id=%s from=%s to=%s type=%s has_body=%s has_media=%s",
            self.provider.provider_name,
            incoming.provider_message_id,
            mask_phone(incoming.from_number),
            mask_phone(incoming.to_number),
            incoming.message_type,
            bool(incoming.body),
            bool(incoming.media_url),
        )
        account = self.accounts.get_active_by_phone(incoming.from_number, self.provider.provider_name)
        if not account:
            logger.warning(
                "whatsapp.account.not_found provider=%s message_id=%s from=%s",
                self.provider.provider_name,
                incoming.provider_message_id,
                mask_phone(incoming.from_number),
            )
            self.messages.create({
                "user_id": None,
                "whatsapp_account_id": None,
                "provider": self.provider.provider_name,
                "provider_message_id": incoming.provider_message_id,
                "direction": "inbound",
                "message_type": incoming.message_type,
                "from_number": incoming.from_number,
                "to_number": incoming.to_number,
                "body": incoming.body,
                "media_url": incoming.media_url,
                "media_content_type": incoming.media_content_type,
                "raw_payload": incoming.raw_payload,
            })
            return self.provider.twiml_response("Este WhatsApp ainda nao esta vinculado a uma conta. Acesse o sistema DinCon e vincule seu numero no Perfil.")

        logger.info(
            "whatsapp.account.found provider=%s account_id=%s user_id=%s from=%s",
            self.provider.provider_name,
            account.id,
            account.user_id,
            mask_phone(incoming.from_number),
        )
        message = self.messages.create({
            "user_id": account.user_id,
            "whatsapp_account_id": account.id,
            "provider": self.provider.provider_name,
            "provider_message_id": incoming.provider_message_id,
            "direction": "inbound",
            "message_type": incoming.message_type,
            "from_number": incoming.from_number,
            "to_number": incoming.to_number,
            "body": incoming.body,
            "media_url": incoming.media_url,
            "media_content_type": incoming.media_content_type,
            "raw_payload": incoming.raw_payload,
        })
        logger.info(
            "whatsapp.message.saved message_id=%s provider_message_id=%s user_id=%s type=%s",
            message.id,
            incoming.provider_message_id,
            account.user_id,
            incoming.message_type,
        )

        pending = self.drafts.get_pending_by_user(account.user_id)
        if pending:
            logger.info(
                "whatsapp.draft.pending_found draft_id=%s user_id=%s reply_has_body=%s has_media=%s",
                pending.id,
                account.user_id,
                bool(incoming.body),
                bool(incoming.media_url),
            )
            return self.provider.twiml_response(self._handle_pending_reply(pending, incoming.body))

        if incoming.media_url and incoming.message_type != "audio":
            logger.info(
                "whatsapp.media.unsupported message_id=%s user_id=%s content_type=%s",
                message.id,
                account.user_id,
                incoming.media_content_type,
            )
            return self.provider.twiml_response("Recebi um arquivo, mas por enquanto so consigo interpretar mensagens de texto ou audio.")

        text = incoming.body or ""
        transcription_prefix = None
        if incoming.message_type == "audio" and incoming.media_url:
            logger.info(
                "whatsapp.audio.received message_sid=%s message_id=%s content_type=%s",
                incoming.provider_message_id,
                message.id,
                incoming.media_content_type,
            )
            downloaded = None
            try:
                downloaded = self.provider.download_media(incoming.media_url, incoming.media_content_type, incoming.provider_message_id)
                text = self.transcriber.transcribe(downloaded.file_path, downloaded.content_type)
                self.messages.update_transcription(message.id, text)
                transcription_prefix = text
                logger.info(
                    "whatsapp.audio.processed_as_text message_id=%s user_id=%s chars=%s",
                    message.id,
                    account.user_id,
                    len(text or ""),
                )
            except AIConfigurationError:
                logger.exception("whatsapp.audio.transcription.not_configured message_id=%s user_id=%s", message.id, account.user_id)
                return self.provider.twiml_response("A transcricao de audio ainda nao esta configurada. Configure a OPENAI_API_KEY no backend ou envie o lancamento por texto.")
            except TwilioMediaTooLargeError:
                logger.warning("whatsapp.audio.too_large message_id=%s user_id=%s", message.id, account.user_id)
                return self.provider.twiml_response("O audio e muito grande. Envie um audio mais curto ou escreva o lancamento em texto.")
            except AudioTranscriptionError:
                logger.exception("whatsapp.audio.transcription.failed message_id=%s user_id=%s", message.id, account.user_id)
                if incoming.body and incoming.body.strip():
                    text = incoming.body
                    logger.info("whatsapp.audio.fallback_body message_id=%s user_id=%s body_length=%s", message.id, account.user_id, len(text))
                else:
                    return self.provider.twiml_response("Nao consegui entender o audio. Pode enviar novamente ou escrever o lancamento em texto?")
            except Exception:
                logger.exception("whatsapp.audio.processing_failed message_id=%s user_id=%s", message.id, account.user_id)
                return self.provider.twiml_response("Nao consegui entender o audio. Pode enviar novamente ou escrever o lancamento em texto?")
            finally:
                if downloaded and not self.provider.settings.whatsapp_keep_audio_files:
                    self._delete_temp_audio(downloaded.file_path, incoming.provider_message_id)

        if not text.strip():
            logger.warning("whatsapp.webhook.empty_text message_id=%s user_id=%s type=%s", message.id, account.user_id, incoming.message_type)
            return self.provider.twiml_response("Nao consegui interpretar esse lancamento. Tente escrever assim: gastei 35 reais no mercado hoje.")

        try:
            draft = self.process_financial_message(account.user_id, message.id, text)
        except AIConfigurationError:
            logger.exception("whatsapp.ai.not_configured message_id=%s user_id=%s", message.id, account.user_id)
            return self.provider.twiml_response("A IA ainda nao esta configurada para interpretar lancamentos. Configure a OPENAI_API_KEY no backend.")
        except TransactionInterpretationError:
            logger.exception("whatsapp.ai.interpretation_failed message_id=%s user_id=%s", message.id, account.user_id)
            return self.provider.twiml_response("Nao consegui interpretar esse lancamento. Tente escrever assim: gastei 35 reais no mercado hoje.")
        logger.info(
            "whatsapp.draft.created draft_id=%s message_id=%s user_id=%s kind=%s amount=%s category_id=%s",
            draft.id,
            message.id,
            account.user_id,
            draft.kind,
            draft.amount,
            draft.category_id,
        )
        return self.provider.twiml_response(self._confirmation_message(draft, transcription_prefix))

    def _handle_pending_reply(self, draft, text: str | None) -> str:
        action = classify_confirmation_reply(text)
        logger.info(
            "whatsapp.draft.reply draft_id=%s user_id=%s action=%s reply_length=%s",
            draft.id,
            draft.user_id,
            action or "unknown",
            len(text or ""),
        )
        if action == "confirm":
            transaction = self.transactions.create({
                "user_id": draft.user_id,
                "budget_id": None,
                "category_id": draft.category_id,
                "kind": draft.kind,
                "title": draft.title,
                "amount": draft.amount,
                "transaction_date": draft.transaction_date,
                "status": "paid",
            })
            self.drafts.update(draft.id, {"status": "confirmed", "created_transaction_id": transaction.id})
            logger.info(
                "whatsapp.draft.confirmed draft_id=%s user_id=%s transaction_id=%s",
                draft.id,
                draft.user_id,
                transaction.id,
            )
            return "Lancamento confirmado e salvo com sucesso."
        if action == "cancel":
            self.drafts.update(draft.id, {"status": "rejected"})
            logger.info("whatsapp.draft.rejected draft_id=%s user_id=%s", draft.id, draft.user_id)
            return "Lancamento cancelado. Nenhum registro foi criado."
        if action == "correct":
            self.drafts.update(draft.id, {"status": "needs_correction"})
            logger.info("whatsapp.draft.needs_correction draft_id=%s user_id=%s", draft.id, draft.user_id)
            return "Me envie a correcao em uma frase. Exemplo: alterar valor para 42,50 e categoria Mercado. Para o MVP, envie o lancamento novamente."
        return (
            "Voce ainda tem um lancamento pendente.\n\n"
            "Responda:\n"
            "1 - Confirmar\n"
            "3 - Cancelar\n\n"
            "Depois disso, envie um novo lancamento."
        )

    def process_financial_message(self, user_id: str, whatsapp_message_id: str, text: str):
        logger.info("whatsapp.draft.create.start message_id=%s user_id=%s text_length=%s", whatsapp_message_id, user_id, len(text))
        return self._create_draft_from_text(user_id, whatsapp_message_id, text)

    def _create_draft_from_text(self, user_id: str, message_id: str, text: str):
        categories = self.categories.list()
        logger.info(
            "whatsapp.ai.interpret.start message_id=%s user_id=%s categories_count=%s text_length=%s",
            message_id,
            user_id,
            len(categories),
            len(text),
        )
        interpreted = self.interpreter.interpret(text, categories, date.today())
        logger.info(
            "whatsapp.ai.interpret.success message_id=%s user_id=%s kind=%s amount=%s category=%s confidence=%s",
            message_id,
            user_id,
            interpreted.kind,
            interpreted.amount,
            interpreted.category_name,
            interpreted.confidence,
        )
        category = CategoryUseCases(self.categories).resolve_or_create_category(interpreted.category_name, interpreted.kind)
        logger.info(
            "whatsapp.category.match message_id=%s user_id=%s requested=%s matched_category_id=%s",
            message_id,
            user_id,
            interpreted.category_name,
            category.id if category else None,
        )
        return self.drafts.create({
            "user_id": user_id,
            "whatsapp_message_id": message_id,
            "status": "pending_confirmation",
            "kind": interpreted.kind,
            "title": interpreted.title[:180],
            "amount": interpreted.amount,
            "category_id": category.id if category else None,
            "transaction_date": interpreted.transaction_date,
            "confidence": interpreted.confidence,
            "ai_explanation": interpreted.notes,
            "original_text": text,
        })

    def _confirmation_message(self, draft, transcription: str | None = None) -> str:
        label = "Receita" if draft.kind == "income" else "Despesa"
        category = draft.category.name if getattr(draft, "category", None) else "Sem categoria"
        prefix = ""
        if transcription:
            prefix = f"Transcrevi seu audio como:\n\n\"{transcription[:500]}\"\n\n"
        return (
            prefix +
            "Entendi este lancamento:\n\n"
            f"Tipo: {label}\n"
            f"Descricao: {draft.title}\n"
            f"Valor: {money_br(draft.amount)}\n"
            f"Categoria: {category}\n"
            f"Data: {date_br(draft.transaction_date)}\n\n"
            "Responda:\n"
            "1 - Confirmar\n"
            "2 - Corrigir\n"
            "3 - Cancelar"
        )

    def _delete_temp_audio(self, file_path: str, message_sid: str | None) -> None:
        try:
            Path(file_path).unlink(missing_ok=True)
            logger.info("whatsapp.audio.temp_file.deleted message_sid=%s file=%s", message_sid, Path(file_path).name)
        except Exception:
            logger.exception("whatsapp.audio.temp_file.delete_failed message_sid=%s file=%s", message_sid, Path(file_path).name)
