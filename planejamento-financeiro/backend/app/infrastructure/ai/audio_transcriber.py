import logging
from pathlib import Path

from openai import OpenAI
from app.core.config import get_settings
from app.infrastructure.ai.transaction_interpreter import AIConfigurationError

logger = logging.getLogger(__name__)


class AudioTranscriptionError(Exception):
    pass


class AudioTranscriber:
    def __init__(self):
        self.settings = get_settings()

    def transcribe(self, file_path: str, content_type: str | None = None) -> str:
        if not self.settings.openai_api_key:
            logger.warning("ai.audio_transcriber.not_configured")
            raise AIConfigurationError("A transcricao de audio ainda nao esta configurada.")
        path = Path(file_path)
        if not path.exists():
            logger.warning("ai.audio_transcriber.file_not_found file=%s", path.name)
            raise AudioTranscriptionError("Arquivo de audio nao encontrado.")
        client = OpenAI(api_key=self.settings.openai_api_key)
        logger.info(
            "whatsapp.audio.transcription.started file=%s content_type=%s model=%s",
            path.name,
            content_type,
            self.settings.openai_transcription_model,
        )
        try:
            with path.open("rb") as audio_file:
                result = client.audio.transcriptions.create(model=self.settings.openai_transcription_model, file=audio_file)
        except Exception as exc:
            logger.exception("whatsapp.audio.transcription.failed file=%s content_type=%s", path.name, content_type)
            raise AudioTranscriptionError("Falha ao transcrever audio.") from exc
        text = (getattr(result, "text", "") or "").strip()
        if not text:
            logger.warning("whatsapp.audio.transcription.empty file=%s", path.name)
            raise AudioTranscriptionError("Transcricao vazia.")
        logger.info("whatsapp.audio.transcription.success file=%s chars=%s", path.name, len(text))
        return text
