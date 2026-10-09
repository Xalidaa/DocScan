from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.document_service import DocumentService
from app.services.preprocessing import Preprocessor
from app.schemas.document import DocumentResponse
from app.schemas.invoice import InvoiceUploadResponse
from app.schemas.preprocessing import PreprocessResult

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return await DocumentService.upload_document(db, file)

@router.get("", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DocumentService.list_documents(db, skip=skip, limit=limit)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    return DocumentService.get_document(db, document_id)

@router.post("/{document_id}/preprocess", response_model=PreprocessResult)
def preprocess_document(document_id: str, db: Session = Depends(get_db)):
    return Preprocessor.preprocess(db, document_id)

@router.post("/{document_id}/export")
def export_document(document_id: str, db: Session = Depends(get_db)):
    return DocumentService.export_document(db, document_id)
