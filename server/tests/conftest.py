import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.core.database import Base, get_db, seed_data
from server.core.security import create_access_token
from server.main import app
import server.models  # noqa: F401

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema_once():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Function-scoped: restore seed data if needed."""
    yield
    # Keep seed users and doctors intact across tests
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_headers():
    token = create_access_token(
        data={
            "sub": "11111111-1111-1111-1111-111111111111",
            "role": "Admin",
            "email": "admin@example.com",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_headers():
    token = create_access_token(
        data={
            "sub": "22222222-2222-2222-2222-222222222222",
            "role": "Doctor",
            "email": "doctor@example.com",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def nurse_headers():
    token = create_access_token(
        data={
            "sub": "33333333-3333-3333-3333-333333333333",
            "role": "Nurse",
            "email": "nurse@example.com",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def receptionist_headers():
    token = create_access_token(
        data={
            "sub": "44444444-4444-4444-4444-444444444444",
            "role": "Receptionist",
            "email": "test@example.com",
        }
    )
    return {"Authorization": f"Bearer {token}"}
