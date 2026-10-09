import os
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentStatus, InvoiceData, LineItem
from app.core.config import settings
from app.schemas.invoice import InvoiceUploadResponse, InvoiceItem, InvoiceExtractionSchema
from app.services.preprocessing import Preprocessor
from app.services.extraction import ExtractionService
from app.services.validation import ValidationService


class DocumentService:
    @staticmethod
    async def upload_document(db: Session, file: UploadFile) -> InvoiceUploadResponse:
        # 1. Validate empty file
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
            
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE} bytes")
            
        # 2. Validate extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}")
            
        # 3. Create database document record
        db_doc = Document(
            filename=file.filename,
            source="upload",
            status=DocumentStatus.RECEIVED
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        # 4. Save file to disk under data/raw/
        raw_dir = settings.UPLOAD_DIR
        os.makedirs(raw_dir, exist_ok=True)
        doc_dir = os.path.join(raw_dir, db_doc.id)
        os.makedirs(doc_dir, exist_ok=True)
        
        file_path = os.path.join(doc_dir, file.filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            db.delete(db_doc)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
            
        db_doc.original_path = file_path
        db.commit()

        # 5. Preprocessing
        try:
            prep_res = Preprocessor.preprocess(db, db_doc.id)
            cleaned_paths = prep_res.cleaned_paths
            prep_warnings = prep_res.warnings
            quality_score = prep_res.quality_score
        except Exception as e:
            print(f"[DocumentService] Preprocessing warning/error: {e}")
            cleaned_paths = [file_path]
            prep_warnings = [f"Preprocessing note: {str(e)}"]
            quality_score = 0.8

        # 6. Extraction (Vision LLM)
        try:
            raw_extraction = ExtractionService.extract_invoice(cleaned_paths, file_path)
        except Exception as e:
            db.delete(db_doc)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Invoice extraction error: {str(e)}")

        # 7. Validation
        validated_data, confidence, flags, final_status = ValidationService.validate(
            extracted=raw_extraction,
            preprocess_warnings=prep_warnings,
            quality_score=quality_score,
            db=db
        )

        # Map status string to DocumentStatus enum
        if final_status == "review_required":
            db_status = DocumentStatus.REVIEW_REQUIRED
        else:
            db_status = DocumentStatus.RECEIVED
        
        db_doc.status = db_status
        db.commit()

        # 8. Save InvoiceData & LineItems to Database
        db_invoice = InvoiceData(
            document_id=db_doc.id,
            supplier_name=validated_data.supplier,
            tin_voen=validated_data.voen,
            invoice_number=validated_data.invoice_number,
            date=validated_data.date,
            subtotal_amount=validated_data.subtotal,
            total_amount=validated_data.total,
            vat_amount=validated_data.vat,
            overall_confidence=confidence,
            validation_flags=flags
        )
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)

        from app.services.product_matcher import ProductMatcherService
        matcher = ProductMatcherService()

        items_response = []
        if validated_data.items:
            for item in validated_data.items:
                match_res = matcher.match_item(item.name)
                db_item = LineItem(
                    invoice_data_id=db_invoice.id,
                    original_name=item.name,
                    matched_product_code=match_res.matched_product_code,
                    matched_product_name=match_res.matched_product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total,
                    confidence_score=match_res.similarity_score
                )
                db.add(db_item)
                items_response.append(InvoiceItem(
                    name=item.name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total=item.total,
                    matched_product_code=match_res.matched_product_code,
                    matched_product_name=match_res.matched_product_name,
                    match_confidence=match_res.similarity_score,
                    match_status=match_res.status
                ))
            db.commit()

        # 9. Return structured invoice JSON response
        return InvoiceUploadResponse(
            document_id=db_doc.id,
            filename=db_doc.filename,
            supplier=validated_data.supplier,
            voen=validated_data.voen,
            invoice_number=validated_data.invoice_number,
            date=validated_data.date,
            subtotal=validated_data.subtotal,
            vat=validated_data.vat,
            total=validated_data.total,
            items=items_response,
            confidence=confidence,
            flags=flags,
            status=db_status.value
        )
        
    @staticmethod
    def update_document(db: Session, document_id: str, update_data: InvoiceExtractionSchema) -> InvoiceUploadResponse:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        if doc.status not in [DocumentStatus.REVIEW_REQUIRED, DocumentStatus.RECEIVED, DocumentStatus.PROCESSING]:
            raise HTTPException(status_code=400, detail=f"Document cannot be updated in its current status: {doc.status.value}")
            
        inv = doc.invoice_data
        if not inv:
            raise HTTPException(status_code=400, detail="Document has no invoice data to update")

        # Update fields
        if update_data.supplier is not None: inv.supplier_name = update_data.supplier
        if update_data.voen is not None: inv.tin_voen = update_data.voen
        if update_data.invoice_number is not None: inv.invoice_number = update_data.invoice_number
        if update_data.date is not None: inv.date = update_data.date
        if update_data.subtotal is not None: inv.subtotal_amount = update_data.subtotal
        if update_data.vat is not None: inv.vat_amount = update_data.vat
        if update_data.total is not None: inv.total_amount = update_data.total

        doc.status = DocumentStatus.APPROVED
        
        if "items" in update_data.model_fields_set:
            db.query(LineItem).filter(LineItem.invoice_data_id == inv.id).delete()
            for item in update_data.items:
                db_item = LineItem(
                    invoice_data_id=inv.id,
                    original_name=item.name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total
                )
                db.add(db_item)
                
        db.commit()
        db.refresh(doc)
        db.refresh(inv)

        items_response = []
        for item in inv.line_items:
            items_response.append(InvoiceItem(
                name=item.original_name or "",
                quantity=item.quantity or 1.0,
                unit_price=item.unit_price or 0.0,
                total=item.total_price or 0.0,
                matched_product_code=item.matched_product_code,
                matched_product_name=item.matched_product_name,
                match_confidence=item.confidence_score,
                match_status="matched" if item.confidence_score and item.confidence_score >= 80 else "unmatched"
            ))

        return InvoiceUploadResponse(
            document_id=doc.id,
            filename=doc.filename,
            supplier=inv.supplier_name,
            voen=inv.tin_voen,
            invoice_number=inv.invoice_number,
            date=inv.date,
            subtotal=inv.subtotal_amount,
            vat=inv.vat_amount,
            total=inv.total_amount,
            items=items_response,
            confidence=inv.overall_confidence or 1.0,
            flags=inv.validation_flags or [],
            status=doc.status.value
        )
        
    @staticmethod
    def update_document_status(db: Session, document_id: str, new_status: str, note: str = None) -> InvoiceUploadResponse:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        status_map = {
            "approved": DocumentStatus.APPROVED,
            "rejected": DocumentStatus.REJECTED,
        }
        target = status_map.get(new_status.lower())
        if not target:
            raise HTTPException(status_code=400, detail=f"Unsupported status transition: {new_status}")

        # REJECTED can be applied from any non-exported state
        if doc.status == DocumentStatus.EXPORTED:
            raise HTTPException(status_code=400, detail="Exported documents cannot have their status changed")

        # APPROVED via this endpoint (no field edits) requires editable state
        if target == DocumentStatus.APPROVED and doc.status not in [
            DocumentStatus.REVIEW_REQUIRED, DocumentStatus.RECEIVED, DocumentStatus.PROCESSING, DocumentStatus.REJECTED
        ]:
            raise HTTPException(status_code=400, detail=f"Cannot approve document in status: {doc.status.value}")

        doc.status = target
        db.commit()
        db.refresh(doc)

        inv = doc.invoice_data
        items_response = []
        if inv and inv.line_items:
            for item in inv.line_items:
                items_response.append(InvoiceItem(
                    name=item.original_name or "",
                    quantity=item.quantity or 1.0,
                    unit_price=item.unit_price or 0.0,
                    total=item.total_price or 0.0,
                    matched_product_code=item.matched_product_code,
                    matched_product_name=item.matched_product_name,
                    match_confidence=item.confidence_score,
                    match_status="matched" if item.confidence_score and item.confidence_score >= 80 else "unmatched"
                ))

        return InvoiceUploadResponse(
            document_id=doc.id,
            filename=doc.filename,
            supplier=inv.supplier_name if inv else None,
            voen=inv.tin_voen if inv else None,
            invoice_number=inv.invoice_number if inv else None,
            date=inv.date if inv else None,
            subtotal=inv.subtotal_amount if inv else None,
            vat=inv.vat_amount if inv else None,
            total=inv.total_amount if inv else None,
            items=items_response,
            confidence=inv.overall_confidence if inv else 1.0,
            flags=inv.validation_flags if inv else [],
            status=doc.status.value
        )

    @staticmethod
    def list_documents(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Document).offset(skip).limit(limit).all()
        
    @staticmethod
    def get_document(db: Session, document_id: str):
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc

    @staticmethod
    def export_document(db: Session, document_id: str):
        doc = DocumentService.get_document(db, document_id)
        if not doc.invoice_data:
            raise HTTPException(status_code=400, detail="Document has no extracted invoice data to export")
            
        from app.services.erp import get_erp_adapter
        adapter = get_erp_adapter()
        
        success, message, meta = adapter.export_invoice(doc.invoice_data)
        
        if success:
            doc.status = DocumentStatus.EXPORTED
            db.commit()
            return {"status": "success", "message": message, "erp_id": meta.get("erp_id")}
        else:
            raise HTTPException(status_code=502, detail=message)
