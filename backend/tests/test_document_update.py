import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.document import Document, InvoiceData, LineItem, DocumentStatus
from main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_update_document_success(setup_db):
    doc = Document(id="doc-123", status=DocumentStatus.REVIEW_REQUIRED)
    setup_db.add(doc)
    inv = InvoiceData(id="inv-123", document_id="doc-123", supplier_name="Old Name", subtotal_amount=100.0)
    setup_db.add(inv)
    li = LineItem(invoice_data_id="inv-123", original_name="Item 1")
    setup_db.add(li)
    setup_db.commit()

    payload = {
        "supplier": "New Name",
        "subtotal": 150.0,
        "items": [
            {"name": "New Item 1", "quantity": 2, "unit_price": 50, "total": 100}
        ]
    }
    
    response = client.put("/api/documents/doc-123", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["supplier"] == "New Name"
    assert data["subtotal"] == 150.0
    assert data["status"] == "approved"
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "New Item 1"

def test_update_document_not_found(setup_db):
    response = client.put("/api/documents/nonexistent", json={})
    assert response.status_code == 404

def test_update_document_invalid_status(setup_db):
    doc = Document(id="doc-456", status=DocumentStatus.EXPORTED)
    setup_db.add(doc)
    inv = InvoiceData(id="inv-456", document_id="doc-456", supplier_name="Name")
    setup_db.add(inv)
    setup_db.commit()

    response = client.put("/api/documents/doc-456", json={"supplier": "New"})
    assert response.status_code == 400
    assert "status" in response.json()["detail"].lower()

def test_update_document_empty_items(setup_db):
    doc = Document(id="doc-789", status=DocumentStatus.REVIEW_REQUIRED)
    setup_db.add(doc)
    inv = InvoiceData(id="inv-789", document_id="doc-789", supplier_name="Old")
    setup_db.add(inv)
    li = LineItem(invoice_data_id="inv-789", original_name="Item 1")
    setup_db.add(li)
    setup_db.commit()

    # Sending empty items array should delete existing items
    response = client.put("/api/documents/doc-789", json={"supplier": "New", "items": []})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 0

    # Sending no items field should keep existing items
    li = LineItem(invoice_data_id="inv-789", original_name="Item 2")
    setup_db.add(li)
    doc = setup_db.query(Document).filter_by(id="doc-789").first()
    doc.status = DocumentStatus.REVIEW_REQUIRED
    setup_db.commit()

    response = client.put("/api/documents/doc-789", json={"supplier": "Another"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    
def test_update_document_rollback_on_error(setup_db, monkeypatch):
    doc = Document(id="doc-err", status=DocumentStatus.REVIEW_REQUIRED)
    setup_db.add(doc)
    inv = InvoiceData(id="inv-err", document_id="doc-err", supplier_name="Before Error")
    setup_db.add(inv)
    setup_db.commit()

    # Mock db.commit to raise an exception
    def mock_commit():
        raise Exception("Simulated DB error")
    
    # We need to monkeypatch the db instance inside the route, but that's hard to target directly.
    # We can cause a SQLAlchemy error by providing an invalid value type that fails at commit.
    pass # Actually FastAPI handles DB exceptions by returning 500 and rolling back if a middleware is present.
    # In SQLite, adding a string to a float field might trigger it, but Python/SQLite is often flexible.
    # Let's monkeypatch the DocumentService.update_document method to raise an error after changing state.
    from app.services.document_service import DocumentService
    orig_update = DocumentService.update_document
    
    def buggy_update(db, doc_id, data):
        # manually change something
        inv = db.query(InvoiceData).filter_by(document_id=doc_id).first()
        inv.supplier_name = "Should be rolled back"
        db.flush()
        raise Exception("Simulated DB error")
        
    monkeypatch.setattr(DocumentService, "update_document", buggy_update)
    
    with pytest.raises(Exception):
        client.put("/api/documents/doc-err", json={"supplier": "New Name"})
        
    setup_db.rollback() # reset session state
    # Verify the old name remains
    inv_check = setup_db.query(InvoiceData).filter_by(document_id="doc-err").first()
    assert inv_check.supplier_name == "Before Error"
