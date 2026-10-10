from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.document import DocumentStatus
from app.schemas.invoice import InvoiceItem

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: DocumentStatus
    source: str
    document_type: Optional[str] = None
    created_at: datetime
    
    supplier: Optional[str] = None
    voen: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    subtotal: Optional[float] = None
    vat: Optional[float] = None
    total: Optional[float] = None
    items: List[InvoiceItem] = Field(default_factory=list)
    confidence: float = 1.0
    flags: List[Any] = Field(default_factory=list)

    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str

