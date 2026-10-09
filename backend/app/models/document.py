import uuid
from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..core.database import Base

class DocumentStatus(enum.Enum):
    RECEIVED = "received"
    PROCESSING = "processing"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPORTED = "exported"

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    filename = Column(String)
    source = Column(String, default="upload")
    document_type = Column(String, nullable=True)
    original_path = Column(String)
    preprocessed_path = Column(String, nullable=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.RECEIVED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    invoice_data = relationship("InvoiceData", back_populates="document", uselist=False)

class InvoiceData(Base):
    __tablename__ = "invoice_data"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String, ForeignKey("documents.id"))
    supplier_name = Column(String, nullable=True)
    tin_voen = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    date = Column(String, nullable=True)
    subtotal_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    vat_amount = Column(Float, nullable=True)
    overall_confidence = Column(Float, nullable=True)
    validation_flags = Column(JSON, nullable=True)
    
    document = relationship("Document", back_populates="invoice_data")
    line_items = relationship("LineItem", back_populates="invoice_data")

class LineItem(Base):
    __tablename__ = "line_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    invoice_data_id = Column(String, ForeignKey("invoice_data.id"))
    original_name = Column(String, nullable=True)
    matched_product_code = Column(String, nullable=True)
    matched_product_name = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    invoice_data = relationship("InvoiceData", back_populates="line_items")
