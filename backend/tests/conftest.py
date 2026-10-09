import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import shutil

from main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass # Ignore if still locked by another process

@pytest.fixture
def db_session(test_db):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Overwrite the dependency
    app.dependency_overrides[get_db] = lambda: session

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()

@pytest.fixture
def client(db_session):
    return TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    # Use a separate upload and clean dir for tests
    original_upload_dir = settings.UPLOAD_DIR
    original_clean_dir = settings.CLEAN_DIR
    settings.UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_data", "raw")
    settings.CLEAN_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_data", "clean")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CLEAN_DIR, exist_ok=True)
    
    yield
    
    # Cleanup test uploads
    if os.path.exists(settings.UPLOAD_DIR):
        shutil.rmtree(settings.UPLOAD_DIR)
    if os.path.exists(settings.CLEAN_DIR):
        shutil.rmtree(settings.CLEAN_DIR)
    
    try:
        shutil.rmtree(os.path.dirname(settings.UPLOAD_DIR))
    except Exception:
        pass
        
    settings.UPLOAD_DIR = original_upload_dir
    settings.CLEAN_DIR = original_clean_dir
