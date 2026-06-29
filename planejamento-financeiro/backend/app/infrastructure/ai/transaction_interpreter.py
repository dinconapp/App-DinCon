import json
import logging
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from openai import OpenAI
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class InterpretedTransaction:
    kind: str
    title: str
    amount: Decimal
    category_name: str
    transaction_date: date
    confidence: Decimal
    needs_confirmation: bool
    notes: str


class AIConfigurationError(Exception):
    pass


class TransactionInterpretationError(Exception):
    pass


class TransactionInterpreter:
    def __init__(self):
        self.settings = get_settings()

    def interpret(self, text: str, available_categories: list, current_date: date) -> InterpretedTransaction:
        if not self.settings.openai_api_key:
            logger.warning("ai.transaction_interpreter.not_configured")
            raise AIConfigurationError("OPENAI_API_KEY nao configurada.")
        categories = [{"name": category.name, "type": category.type} for category in available_categories]
        logger.info(
            "ai.transaction_interpreter.request.start text_length=%s categories_count=%s current_date=%s",
            len(text or ""),
            len(categories),
            current_date.isoformat(),
        )
        prompt = (
            "Voce e um assistente financeiro especializado em interpretar mensagens curtas de WhatsApp para gerar lancamentos financeiros.\n"
            "Retorne somente JSON valido.\n"
            "Campos obrigatorios: kind, title, amount, category_name, transaction_date, confidence, needs_confirmation, notes.\n"
            "Regras: gastei/paguei/comprei/saiu/despesa normalmente e expense. recebi/entrou/ganhei/salario/pix recebido normalmente e income. "
            "Se nao houver data, use a data atual. Se nao houver categoria clara, use Outros. Nunca invente valor. amount deve ser positivo. "
            "category_name deve ser uma das categorias disponiveis.\n"
            f"Data atual: {current_date.isoformat()}\n"
            f"Categorias disponiveis: {json.dumps(categories, ensure_ascii=False)}\n"
            f"Mensagem: {text}"
        )
        client = OpenAI(api_key=self.settings.openai_api_key)
        try:
            result = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0,
            )
        except Exception as exc:
            logger.exception("ai.transaction_interpreter.request.failed")
            raise TransactionInterpretationError("Falha ao chamar IA.") from exc
        content = result.choices[0].message.content or "{}"
        logger.info("ai.transaction_interpreter.response.received content_length=%s", len(content))
        try:
            data = json.loads(content)
            if not data.get("amount"):
                raise TransactionInterpretationError("Valor nao identificado.")
            amount = self._decimal(data.get("amount"), "Valor invalido.")
            confidence = self._decimal(data.get("confidence", 0), "Confianca invalida.", default=Decimal("0"))
            interpreted = InterpretedTransaction(
                kind=data["kind"],
                title=data["title"],
                amount=amount,
                category_name=data.get("category_name") or "Outros",
                transaction_date=date.fromisoformat(data["transaction_date"]),
                confidence=confidence,
                needs_confirmation=bool(data.get("needs_confirmation", True)),
                notes=data.get("notes", ""),
            )
            logger.info(
                "ai.transaction_interpreter.response.parsed kind=%s amount=%s category=%s confidence=%s date=%s",
                interpreted.kind,
                interpreted.amount,
                interpreted.category_name,
                interpreted.confidence,
                interpreted.transaction_date,
            )
            return interpreted
        except TransactionInterpretationError:
            logger.exception("ai.transaction_interpreter.response.invalid_business_rule")
            raise
        except (KeyError, ValueError, json.JSONDecodeError, InvalidOperation) as exc:
            logger.exception("ai.transaction_interpreter.response.invalid")
            raise TransactionInterpretationError("Nao foi possivel interpretar o lancamento.") from exc

    def _decimal(self, value, message: str, default: Decimal | None = None) -> Decimal:
        if value is None and default is not None:
            return default
        try:
            return Decimal(str(value).replace(",", "."))
        except (InvalidOperation, ValueError) as exc:
            if default is not None:
                return default
            raise TransactionInterpretationError(message) from exc
