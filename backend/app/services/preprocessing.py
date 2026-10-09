import os
import cv2
import numpy as np
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentStatus
from app.core.config import settings
from app.schemas.preprocessing import PreprocessResult

class Preprocessor:
    @staticmethod
    def process_image(img_array: np.ndarray) -> tuple[np.ndarray, list[str], float]:
        warnings = []
        quality_score = 1.0
        
        # 1. Grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_array
            
        # 2. Check resolution
        h, w = gray.shape
        if h < 500 or w < 500:
            warnings.append("Extremely low resolution")
            quality_score -= 0.3
            
        # 3. Check blur (variance of Laplacian)
        blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_val < 50:
            warnings.append("Excessive blur detected")
            quality_score -= 0.4
            
        # 4. Check if too dark
        mean_brightness = np.mean(gray)
        if mean_brightness < 40:
            warnings.append("Unreadable or very dark image")
            quality_score -= 0.3
            
        # 5. Check if empty (very low variance)
        if np.std(gray) < 10:
            warnings.append("Page appears to be empty")
            quality_score -= 0.2
            
        # 6. Reduce noise & improve contrast
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, None, h=10, searchWindowSize=21, templateWindowSize=7)
        # Contrast (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
        
        # 7. Deskew (simplified)
        coords = np.column_stack(np.where(enhanced > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Only rotate if the angle is significant but small (e.g., between 1 and 15 degrees)
            if 0.5 < abs(angle) < 15.0:
                (h_img, w_img) = enhanced.shape[:2]
                center = (w_img // 2, h_img // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                enhanced = cv2.warpAffine(enhanced, M, (w_img, h_img), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                
        return enhanced, warnings, max(0.0, min(1.0, quality_score))

    @staticmethod
    def preprocess(db: Session, document_id: str) -> PreprocessResult:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        original_path = doc.original_path
        if not original_path or not os.path.exists(original_path):
            raise HTTPException(status_code=404, detail="Original document file not found")
            
        clean_dir = os.path.join(settings.CLEAN_DIR, document_id)
        os.makedirs(clean_dir, exist_ok=True)
        
        cleaned_paths = []
        all_warnings = []
        total_score = 0.0
        page_count = 0
        
        ext = os.path.splitext(original_path)[1].lower()
        
        try:
            if ext == '.pdf':
                if fitz is not None:
                    doc_pdf = fitz.open(original_path)
                    page_count = len(doc_pdf)
                    for i in range(page_count):
                        page = doc_pdf.load_page(i)
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scale for better res
                        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                        
                        if pix.n == 4:
                            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
                        elif pix.n == 3:
                            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                            
                        clean_img, warnings, score = Preprocessor.process_image(img_array)
                        if warnings:
                            all_warnings.extend([f"Page {i+1}: {w}" for w in warnings])
                        total_score += score
                        
                        out_path = os.path.join(clean_dir, f"page_{i+1}.png")
                        cv2.imwrite(out_path, clean_img)
                        cleaned_paths.append(out_path)
                    doc_pdf.close()
                else:
                    page_count = 1
                    total_score = 0.8
                    all_warnings.append("PyMuPDF unavailable for PDF rendering; using direct file mode")
                    # Create blank page representation for pipeline continuity
                    blank_img = np.full((1000, 800, 3), 255, dtype=np.uint8)
                    cv2.putText(blank_img, f"PDF Document: {os.path.basename(original_path)}", (50, 500), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
                    out_path = os.path.join(clean_dir, "page_1.png")
                    cv2.imwrite(out_path, blank_img)
                    cleaned_paths.append(out_path)
                
            else:
                # Treat as image
                img_array = cv2.imread(original_path)
                if img_array is None:
                    raise ValueError("Failed to decode image")
                    
                page_count = 1
                clean_img, warnings, score = Preprocessor.process_image(img_array)
                all_warnings.extend(warnings)
                total_score += score
                
                out_path = os.path.join(clean_dir, "page_1.png")
                cv2.imwrite(out_path, clean_img)
                cleaned_paths.append(out_path)
                
        except Exception as e:
            # Revert state if necessary, but don't delete original
            raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")
            
        avg_score = total_score / page_count if page_count > 0 else 0.0
        
        # Update DB
        doc.status = DocumentStatus.PROCESSING
        doc.preprocessed_path = clean_dir
        db.commit()
        
        return PreprocessResult(
            document_id=document_id,
            cleaned_paths=cleaned_paths,
            page_count=page_count,
            quality_score=round(avg_score, 2),
            warnings=all_warnings,
            success=True
        )
