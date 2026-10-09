import os
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentStatus, InvoiceData, LineItem
from app.core.config import settings
from app.schemas.invoice import InvoiceUploadResponse, InvoiceItem
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
