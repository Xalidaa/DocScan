import io

def test_upload_valid_pdf(client):
    file_content = b"%PDF-1.4 mock content"
    response = client.post(
        "/api/documents/upload",
        files={"file": ("invoice.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["filename"] == "invoice.pdf"
    assert "status" in data
    assert "supplier" in data
    assert "voen" in data
    assert "invoice_number" in data
    assert "date" in data
    assert "subtotal" in data
    assert "vat" in data
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert "confidence" in data
    assert "flags" in data

def test_upload_valid_image(client):
    file_content = b"\x89PNG\r\n\x1a\n mock image content"
    response = client.post(
        "/api/documents/upload",
        files={"file": ("receipt.png", io.BytesIO(file_content), "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["filename"] == "receipt.png"
    assert "items" in data

def test_upload_unsupported_extension(client):
    file_content = b"mock content"
    response = client.post(
        "/api/documents/upload",
        files={"file": ("document.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]

def test_upload_empty_file(client):
    response = client.post(
        "/api/documents/upload",
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    )
    assert response.status_code == 400
    assert "File is empty" in response.json()["detail"]

def test_list_documents(client):
    client.post(
        "/api/documents/upload",
        files={"file": ("doc1.pdf", io.BytesIO(b"content"), "application/pdf")}
    )
    
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["filename"] == "doc1.pdf"

def test_get_document(client):
    upload_response = client.post(
        "/api/documents/upload",
        files={"file": ("doc2.pdf", io.BytesIO(b"content"), "application/pdf")}
    )
    doc_id = upload_response.json()["document_id"]
    
    response = client.get(f"/api/documents/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == doc_id
    assert data["filename"] == "doc2.pdf"
    assert data["source"] == "upload"

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

