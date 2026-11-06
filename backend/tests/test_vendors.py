import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.models import (
    Organization,
    User,
    Role,
    OrganizationStatus,
    UserStatus,
    Vendor,
    VendorCriticality,
    VendorStatus,
    DataClassification,
    AccessLevel,
)
from app.core.security import create_access_token
from app.core.init_db import seed_roles_and_permissions
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_roles_and_permissions(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def setup_data(db_session):
    org1 = Organization(id=str(uuid.uuid4()), name="Alpha Tenant", slug="alpha-tenant", status=OrganizationStatus.ACTIVE)
    org2 = Organization(id=str(uuid.uuid4()), name="Beta Tenant", slug="beta-tenant", status=OrganizationStatus.ACTIVE)
    db_session.add_all([org1, org2])
    db_session.flush()

    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    auditor_role = db_session.query(Role).filter(Role.name == "auditor").first()

    # User 1: Admin in Alpha
    user_alpha = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-alpha-admin",
        email="admin@alpha.com",
        full_name="Alpha Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )

    # User 2: Auditor in Alpha (read-only)
    user_alpha_auditor = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-alpha-auditor",
        email="auditor@alpha.com",
        full_name="Alpha Auditor",
        status=UserStatus.ACTIVE,
        roles=[auditor_role]
    )

    # User 3: Admin in Beta
    user_beta = User(
        id=str(uuid.uuid4()),
        organization_id=org2.id,
        identity_subject="sub-beta-admin",
        email="admin@beta.com",
        full_name="Beta Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )

    db_session.add_all([user_alpha, user_alpha_auditor, user_beta])
    db_session.flush()

    # Pre-seed a vendor in Alpha
    vendor_alpha = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        name="Alpha Payment Systems",
        website="https://alphapay.com",
        industry="Financial technology",
        service_category="Payment Gateway",
        criticality=VendorCriticality.TIER_1,
        status=VendorStatus.ACTIVE,
        data_classification=DataClassification.CONFIDENTIAL,
        access_level=AccessLevel.APPLICATION,
        risk_score=85,
    )
    # Pre-seed a vendor in Beta
    vendor_beta = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org2.id,
        name="Beta Cloud Storage",
        website="https://betacloud.io",
        industry="Technology",
        service_category="Infrastructure",
        criticality=VendorCriticality.TIER_2,
        status=VendorStatus.MONITORED,
        data_classification=DataClassification.INTERNAL,
        access_level=AccessLevel.DATABASE,
        risk_score=78,
    )
    db_session.add_all([vendor_alpha, vendor_beta])
    db_session.commit()

    return {
        "org1": org1,
        "org2": org2,
        "user_alpha": user_alpha,
        "user_alpha_auditor": user_alpha_auditor,
        "user_beta": user_beta,
        "vendor_alpha": vendor_alpha,
        "vendor_beta": vendor_beta,
    }


def auth_header(user: User):
    token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# --- 1. Vendor CRUD Operations ---

def test_vendor_create_read_update_delete(client, setup_data):
    admin = setup_data["user_alpha"]

    # 1. Create Vendor
    payload = {
        "name": "Datadog Telemetry Inc",
        "website": "https://datadoghq.com",
        "industry": "Observability & Monitoring",
        "service_category": "DevSecOps",
        "service_description": "Cloud telemetry and metrics collection",
        "criticality": "tier_1",
        "status": "active",
        "data_classification": "confidential",
        "access_level": "network",
        "contacts": [
            {
                "name": "Jane Doe",
                "email": "jane.doe@datadog.com",
                "phone": "+1-555-0199",
                "title": "Account Director",
                "is_primary": True
            }
        ]
    }
    create_res = client.post("/api/v1/vendors", json=payload, headers=auth_header(admin))
    assert create_res.status_code == 201
    vendor_data = create_res.json()
    assert vendor_data["name"] == "Datadog Telemetry Inc"
    assert len(vendor_data["contacts"]) == 1
    vendor_id = vendor_data["id"]

    # 2. Read Single Vendor
    get_res = client.get(f"/api/v1/vendors/{vendor_id}", headers=auth_header(admin))
    assert get_res.status_code == 200
    assert get_res.json()["industry"] == "Observability & Monitoring"

    # 3. Update Vendor
    patch_payload = {
        "criticality": "tier_2",
        "status": "monitored",
        "risk_score": 90
    }
    patch_res = client.patch(f"/api/v1/vendors/{vendor_id}", json=patch_payload, headers=auth_header(admin))
    assert patch_res.status_code == 200
    assert patch_res.json()["criticality"] == "tier_2"
    assert patch_res.json()["status"] == "monitored"
    assert patch_res.json()["risk_score"] == 90

    # 4. Delete Vendor
    del_res = client.delete(f"/api/v1/vendors/{vendor_id}", headers=auth_header(admin))
    assert del_res.status_code == 204

    # Verify deleted
    verify_res = client.get(f"/api/v1/vendors/{vendor_id}", headers=auth_header(admin))
    assert verify_res.status_code == 404


# --- 2. Tenant Isolation & IDOR Protection ---

def test_vendor_tenant_isolation_and_idor(client, setup_data):
    user_alpha = setup_data["user_alpha"]
    vendor_beta = setup_data["vendor_beta"]

    # Alpha user tries to get Beta's vendor by ID (IDOR Attempt)
    resp = client.get(f"/api/v1/vendors/{vendor_beta.id}", headers=auth_header(user_alpha))
    assert resp.status_code == 404  # Tenant isolation treats other tenant's IDs as non-existent to prevent enumeration

    # Alpha user tries to update Beta's vendor
    patch_resp = client.patch(
        f"/api/v1/vendors/{vendor_beta.id}",
        json={"name": "Hacked Name"},
        headers=auth_header(user_alpha)
    )
    assert patch_resp.status_code == 404

    # Alpha user lists vendors - must NOT see Beta's vendor
    list_resp = client.get("/api/v1/vendors", headers=auth_header(user_alpha))
    assert list_resp.status_code == 200
    vendor_ids = [v["id"] for v in list_resp.json()]
    assert vendor_beta.id not in vendor_ids


# --- 3. Duplicate Prevention & Validation ---

def test_vendor_duplicate_name_prevention(client, setup_data):
    admin = setup_data["user_alpha"]
    existing_vendor = setup_data["vendor_alpha"]

    # Attempt to create vendor with same name in same tenant
    payload = {
        "name": existing_vendor.name, # "Alpha Payment Systems"
        "industry": "FinTech",
        "service_category": "Payments",
        "criticality": "tier_1",
        "status": "active",
        "data_classification": "confidential",
        "access_level": "application",
    }
    dup_res = client.post("/api/v1/vendors", json=payload, headers=auth_header(admin))
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"]


# --- 4. Role Permissions (Auditor Read-Only vs Admin) ---

def test_auditor_cannot_modify_vendors(client, setup_data):
    auditor = setup_data["user_alpha_auditor"]
    vendor_alpha = setup_data["vendor_alpha"]

    # Auditor CAN list
    list_res = client.get("/api/v1/vendors", headers=auth_header(auditor))
    assert list_res.status_code == 200

    # Auditor CANNOT create
    create_res = client.post(
        "/api/v1/vendors",
        json={
            "name": "Auditor Test Vendor",
            "industry": "Test",
            "service_category": "Test",
            "criticality": "tier_3",
            "status": "under_review",
            "data_classification": "public",
            "access_level": "none"
        },
        headers=auth_header(auditor)
    )
    assert create_res.status_code == 403

    # Auditor CANNOT delete
    del_res = client.delete(f"/api/v1/vendors/{vendor_alpha.id}", headers=auth_header(auditor))
    assert del_res.status_code == 403

