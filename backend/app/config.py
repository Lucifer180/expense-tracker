from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # LLM (Groq / xAI / any OpenAI-compatible API)
    xai_api_key: str
    grok_model: str = "openai/gpt-oss-120b"
    llm_base_url: str = "https://api.groq.com/openai/v1"

    # Frontend (used for CORS and links in emails)
    frontend_url: str = "http://localhost:5173"

    # Email (forgot password). If SMTP_HOST is empty, the reset link is printed to the console.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    reset_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
