from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class InvoiceItem(BaseModel):
    name: str = Field(default="", description="Name or description of line item")
    quantity: Optional[float] = Field(default=1.0, description="Quantity")
    unit_price: Optional[float] = Field(default=0.0, description="Price per unit")
    total: Optional[float] = Field(default=0.0, description="Total line item amount")
    matched_product_code: Optional[str] = Field(default=None, description="Matched catalog product SKU code")
    matched_product_name: Optional[str] = Field(default=None, description="Matched catalog product name")
    match_confidence: Optional[float] = Field(default=None, description="Similarity score 0-100")
    match_status: Optional[str] = Field(default="unmatched", description="Match status: matched, uncertain, unmatched")

class InvoiceExtractionSchema(BaseModel):
    supplier: Optional[str] = Field(default=None, description="Supplier or vendor name")
    voen: Optional[str] = Field(default=None, description="VOEN or TIN tax ID number")
    invoice_number: Optional[str] = Field(default=None, description="Invoice number")
    date: Optional[str] = Field(default=None, description="Document issue date")
    subtotal: Optional[float] = Field(default=None, description="Subtotal before tax")
    vat: Optional[float] = Field(default=None, description="VAT or tax amount")
    total: Optional[float] = Field(default=None, description="Total invoice amount")
    items: List[InvoiceItem] = Field(default_factory=list, description="Line items extracted")

class InvoiceUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: str
    filename: Optional[str] = None
    supplier: Optional[str] = None
    voen: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    subtotal: Optional[float] = None
    vat: Optional[float] = None
    total: Optional[float] = None
    items: List[InvoiceItem] = Field(default_factory=list)
    confidence: float = 1.0
    flags: List[dict] = Field(default_factory=list)
    status: str = "received"
