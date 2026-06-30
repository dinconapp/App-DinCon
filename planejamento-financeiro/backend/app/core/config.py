from functools import lru_cache
from urllib.parse import quote

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="127.0.0.1", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    db_host: str = Field(default="127.0.0.1", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_name: str = Field(default="planejamento_financeiro", alias="DB_NAME")
    db_user: str = Field(default="root", alias="DB_USER")
    db_password: str = Field(default="root", alias="DB_PASSWORD")
    database_url_env: str = Field(default="", alias="DATABASE_URL")
    cors_origins: str = Field(default="", alias="CORS_ORIGINS")
    whatsapp_provider: str = Field(default="twilio", alias="WHATSAPP_PROVIDER")
    twilio_account_sid: str = Field(default="", alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="", alias="TWILIO_AUTH_TOKEN")
    twilio_verify_service_sid: str = Field(default="", alias="TWILIO_VERIFY_SERVICE_SID")
    twilio_verify_channel: str = Field(default="", alias="TWILIO_VERIFY_CHANNEL")
    twilio_verify_email_channel: str = Field(default="email", alias="TWILIO_VERIFY_EMAIL_CHANNEL")
    twilio_verify_sms_channel: str = Field(default="sms", alias="TWILIO_VERIFY_SMS_CHANNEL")
    twilio_whatsapp_number: str = Field(default="whatsapp:+14155238886", alias="TWILIO_WHATSAPP_NUMBER")
    twilio_webhook_validate_signature: bool = Field(default=False, alias="TWILIO_WEBHOOK_VALIDATE_SIGNATURE")
    whatsapp_audio_storage_dir: str = Field(default="storage/whatsapp/audio", alias="WHATSAPP_AUDIO_STORAGE_DIR")
    whatsapp_keep_audio_files: bool = Field(default=False, alias="WHATSAPP_KEEP_AUDIO_FILES")
    whatsapp_max_audio_mb: int = Field(default=15, alias="WHATSAPP_MAX_AUDIO_MB")
    app_public_url: str = Field(default="", alias="APP_PUBLIC_URL")
    api_public_url: str = Field(default="http://127.0.0.1:8000", alias="API_PUBLIC_URL")
    ai_provider: str = Field(default="openai", alias="AI_PROVIDER")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_transcription_model: str = Field(default="whisper-1", alias="OPENAI_TRANSCRIPTION_MODEL")
    payments_provider: str = Field(default="mercadopago", alias="PAYMENTS_PROVIDER")
    payments_mock_mode: bool = Field(default=False, alias="PAYMENTS_MOCK_MODE")
    payments_default_statement_descriptor: str = Field(default="DINCON", alias="PAYMENTS_DEFAULT_STATEMENT_DESCRIPTOR")
    mercado_pago_api_base_url: str = Field(default="https://api.mercadopago.com", alias="MERCADO_PAGO_API_BASE_URL")
    mercado_pago_access_token: str = Field(default="", alias="MERCADO_PAGO_ACCESS_TOKEN")
    mercado_pago_public_key: str = Field(default="", alias="MERCADO_PAGO_PUBLIC_KEY")
    mercado_pago_webhook_secret: str = Field(default="", alias="MERCADO_PAGO_WEBHOOK_SECRET")
    jwt_secret_key: str = Field(default="change-me", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=1440, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in {"production", "prod"}

    @property
    def database_url(self) -> str:
        if self.database_url_env.strip():
            return self.database_url_env.strip()

        user = quote(self.db_user, safe="")
        password = quote(self.db_password, safe="")
        host = self.db_host.strip()
        name = quote(self.db_name, safe="")
        return f"postgresql+psycopg2://{user}:{password}@{host}:{self.db_port}/{name}"

    @property
    def allowed_cors_origins(self) -> list[str]:
        configured = [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        if self.is_production:
            return configured

        local_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
        return list(dict.fromkeys([*configured, *local_origins]))

    class Config:
        env_file = ".env"
        populate_by_name = True
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
