import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocScan Agent API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./docscan.db")
    CLAUDE_API_KEY: str | None = os.getenv("CLAUDE_API_KEY")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024 # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg"}
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
    CLEAN_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "clean")
    
    # ERP Configuration
    ERP_MOCK_MODE: bool = os.getenv("ERP_MOCK_MODE", "True").lower() in ("true", "1", "yes")
    ODOO_URL: str = os.getenv("ODOO_URL", "http://localhost:8069")
    ODOO_DB: str = os.getenv("ODOO_DB", "odoo")
    ODOO_USER: str = os.getenv("ODOO_USER", "admin")
    ODOO_PASSWORD: str = os.getenv("ODOO_PASSWORD", "admin")

    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")

settings = Settings()

