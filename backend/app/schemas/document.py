from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.document import DocumentStatus

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: DocumentStatus
    source: str
    document_type: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
