from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.schemas.invoice import InvoiceExtractionSchema
from app.models.document import InvoiceData

class ValidationService:
    @staticmethod
    def validate(
        extracted: InvoiceExtractionSchema,
        preprocess_warnings: List[str] = None,
        quality_score: float = 1.0,
        db: Optional[Session] = None
    ) -> Tuple[InvoiceExtractionSchema, float, List[Dict[str, Any]], str]:
        """
        Validates invoice data, calculates confidence score, generates structured flags, and determines document status.
        """
        flags: List[Dict[str, Any]] = []
        confidence = min(1.0, max(0.0, float(quality_score)))

        def add_flag(flag_type: str, severity: str, message: str, field: str):
            flags.append({
                "type": flag_type,
                "severity": severity,
                "message": message,
                "field": field
            })

        # Incorporate preprocessing warnings
        if preprocess_warnings:
            for w in preprocess_warnings:
                add_flag("image_quality", "warning", f"Image Warning: {w}", "image")
            confidence -= 0.05 * len(preprocess_warnings)

        # 1. Required field checks
        if not extracted.supplier or not extracted.supplier.strip():
            add_flag("missing_field", "blocking", "Missing supplier name", "supplier")
            confidence -= 0.15

        if not extracted.voen or not str(extracted.voen).strip():
            add_flag("missing_field", "blocking", "Missing VOEN / Tax ID", "voen")
            confidence -= 0.15
        else:
            cleaned_voen = re_clean_digits(str(extracted.voen))
            if len(cleaned_voen) not in (9, 10):
                add_flag("format", "blocking", "VOEN / Tax ID format warning (expected 9-10 digits)", "voen")
                confidence -= 0.05

        if not extracted.invoice_number or not str(extracted.invoice_number).strip():
            add_flag("missing_field", "blocking", "Missing invoice number", "invoice_number")
            confidence -= 0.10

        if not extracted.date or not str(extracted.date).strip():
            add_flag("missing_field", "blocking", "Missing invoice date", "date")
            confidence -= 0.10

        if extracted.total is None or extracted.total <= 0:
            add_flag("missing_field", "blocking", "Invalid or zero total amount", "total")
            confidence -= 0.25

        if not extracted.items:
            add_flag("missing_field", "blocking", "No line items extracted", "items")
            confidence -= 0.15
        else:
            # Check line item totals and suspicious prices
            for idx, item in enumerate(extracted.items):
                # Suspicious price check
                if item.unit_price is not None and (item.unit_price < 0 or item.unit_price > 1000000):
                    add_flag("anomaly", "blocking", f"Suspicious unit price for item '{item.name}': {item.unit_price}", f"items[{idx}].unit_price")
                    confidence -= 0.10

                if item.quantity and item.unit_price and item.total is not None:
                    expected = item.quantity * item.unit_price
                    if abs(expected - item.total) > 0.05:
                        add_flag(
                            "math", 
                            "blocking", 
                            f"Line item '{item.name or 'item'}' math mismatch: {item.quantity} * {item.unit_price} != {item.total}", 
                            f"items[{idx}].total"
                        )
                        confidence -= 0.05

        # 2. Math validation: subtotal + vat == total
        sub = extracted.subtotal or 0.0
        vat = extracted.vat or 0.0
        tot = extracted.total or 0.0

        if sub > 0 and vat >= 0 and tot > 0:
            calculated_total = round(sub + vat, 2)
            if abs(calculated_total - tot) > 0.10:
                add_flag(
                    "math", 
                    "blocking", 
                    f"Financial math mismatch: subtotal ({sub}) + vat ({vat}) = {calculated_total}, but total is {tot}", 
                    "total"
                )
                confidence -= 0.20

        # 3. Duplicate invoice number check (if db is provided)
        if db and extracted.invoice_number and extracted.supplier:
            # Check if this exact invoice number from this supplier already exists
            existing = db.query(InvoiceData).filter(
                InvoiceData.invoice_number == extracted.invoice_number,
                InvoiceData.supplier_name == extracted.supplier
            ).first()
            if existing:
                add_flag("duplicate", "blocking", f"Duplicate invoice number '{extracted.invoice_number}' for supplier '{extracted.supplier}'", "invoice_number")
                confidence -= 0.30

        final_confidence = round(max(0.0, min(1.0, confidence)), 2)

        # 4. Determine status
        has_blocking = any(f.get("severity") == "blocking" for f in flags)
        if has_blocking or final_confidence < 0.85:
            status = "review_required"
        else:
            status = "received"

        return extracted, final_confidence, flags, status


def re_clean_digits(val: str) -> str:
    import re
    return re.sub(r'\D', '', val)
