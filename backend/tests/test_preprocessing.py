import io
import cv2
import numpy as np

def test_preprocess_missing_document(client):
    response = client.post("/api/documents/nonexistent-id/preprocess")
    assert response.status_code == 404

def test_preprocess_valid_image(client):
    # Create a simple valid image
    img = np.zeros((600, 600, 3), dtype=np.uint8)
    img.fill(255) # white background
    cv2.putText(img, 'Test Document', (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    
    # Encode to PNG
    _, buffer = cv2.imencode('.png', img)
    file_content = buffer.tobytes()
    
    # Upload
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("test.png", io.BytesIO(file_content), "image/png")}
    )
    doc_id = upload_res.json()["document_id"]
    
    # Preprocess
    prep_res = client.post(f"/api/documents/{doc_id}/preprocess")
    assert prep_res.status_code == 200
    data = prep_res.json()
    assert data["document_id"] == doc_id
    assert data["success"] is True
    assert data["page_count"] == 1
    assert len(data["cleaned_paths"]) == 1
    
    # Verify DB status
    doc_res = client.get(f"/api/documents/{doc_id}")
    assert doc_res.json()["status"] == "processing"

def test_preprocess_low_quality_image(client):
    # Create a small, dark, blurry image
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    img.fill(20) # very dark
    img = cv2.GaussianBlur(img, (15, 15), 0) # very blurry
    
    _, buffer = cv2.imencode('.png', img)
    
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("bad.png", io.BytesIO(buffer.tobytes()), "image/png")}
    )
    doc_id = upload_res.json()["document_id"]
    
    prep_res = client.post(f"/api/documents/{doc_id}/preprocess")
    assert prep_res.status_code == 200
    data = prep_res.json()
    
    assert data["success"] is True
    assert len(data["warnings"]) > 0
    assert any("Extremely low resolution" in w for w in data["warnings"])
    assert data["quality_score"] < 1.0
