from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.core.config import settings
from app.models import document

from app.api import documents

# Create database tables
Base.metadata.create_all(bind=engine)

# Parse CORS origins from settings or environment
origins_raw = getattr(settings, "ALLOWED_ORIGINS", "*")
if isinstance(origins_raw, str):
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
else:
    origins = list(origins_raw)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)

@app.get("/")
def read_root():
    return {"message": "DocScan Agent API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

