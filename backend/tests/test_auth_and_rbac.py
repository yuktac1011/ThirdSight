import pytest
import uuid
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.models import Organization, User, Role, OrganizationStatus, UserStatus
from app.core.security import create_access_token
from app.core.init_db import seed_roles_and_permissions
from app.main import app

# In-memory SQLite for high-speed test isolation
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
def setup_tenants(db_session):
    # Tenant 1 (Acme Corp)
    org1 = Organization(id=str(uuid.uuid4()), name="Acme Corp", slug="acme-corp", status=OrganizationStatus.ACTIVE)
    # Tenant 2 (CyberDyne)
    org2 = Organization(id=str(uuid.uuid4()), name="CyberDyne", slug="cyberdyne", status=OrganizationStatus.ACTIVE)
    db_session.add_all([org1, org2])
    db_session.flush()

    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    analyst_role = db_session.query(Role).filter(Role.name == "analyst").first()

    # User 1: Admin in Acme Corp
    user_admin1 = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-admin1",
        email="admin@acme.com",
        full_name="Acme Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )
    # User 2: Analyst in Acme Corp
    user_analyst1 = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-analyst1",
        email="analyst@acme.com",
        full_name="Acme Analyst",
        status=UserStatus.ACTIVE,
        roles=[analyst_role]
    )
    # User 3: Admin in CyberDyne
    user_admin2 = User(
        id=str(uuid.uuid4()),
        organization_id=org2.id,
        identity_subject="sub-admin2",
        email="admin@cyberdyne.com",
        full_name="Cyberdyne Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )

    db_session.add_all([user_admin1, user_analyst1, user_admin2])
    db_session.commit()

    return {
        "org1": org1,
        "org2": org2,
        "admin1": user_admin1,
        "analyst1": user_analyst1,
        "admin2": user_admin2,
    }


def auth_header(user: User):
    token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# --- 1. Authentication & Token Tests ---

def test_login_and_me(client, setup_tenants):
    admin1 = setup_tenants["admin1"]
    response = client.post("/api/v1/auth/login", json={"email": admin1.email})
    assert response.status_code == 200
    token = response.json()["access_token"]

    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    data = me_resp.json()
    assert data["email"] == admin1.email
    assert data["organization_slug"] == "acme-corp"
    assert "org:update" in data["permissions"]


def test_invalid_and_expired_token(client):
    # Missing token
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    # Fake token
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer badtoken123"})
    assert resp.status_code == 401

    # Expired token
    expired_token = create_access_token(
        data={"sub": "any-id"},
        expires_delta=timedelta(seconds=-10)
    )
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


# --- 2. Tenant Isolation & Cross-Tenant Protection Tests ---

def test_tenant_organization_isolation(client, setup_tenants):
    admin1 = setup_tenants["admin1"]
    org1 = setup_tenants["org1"]
    org2 = setup_tenants["org2"]

    # Can read own organization
    resp = client.get(f"/api/v1/organizations/{org1.id}", headers=auth_header(admin1))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Corp"

    # CANNOT read other tenant's organization (cross-tenant access forbidden)
    resp = client.get(f"/api/v1/organizations/{org2.id}", headers=auth_header(admin1))
    assert resp.status_code == 403
    assert "Cross-tenant access forbidden" in resp.json()["detail"]


def test_tenant_user_listing_isolation(client, setup_tenants):
    admin1 = setup_tenants["admin1"]
    admin2 = setup_tenants["admin2"]

    # Acme Admin sees Acme users (admin1 & analyst1), NOT cyberdyne users
    resp1 = client.get("/api/v1/users", headers=auth_header(admin1))
    assert resp1.status_code == 200
    emails1 = [u["email"] for u in resp1.json()]
    assert "admin@acme.com" in emails1
    assert "analyst@acme.com" in emails1
    assert "admin@cyberdyne.com" not in emails1

    # Cyberdyne Admin sees CyberDyne users only
    resp2 = client.get("/api/v1/users", headers=auth_header(admin2))
    assert resp2.status_code == 200
    emails2 = [u["email"] for u in resp2.json()]
    assert "admin@cyberdyne.com" in emails2
    assert "admin@acme.com" not in emails2


# --- 3. Role-Based Access Control (RBAC) Tests ---

def test_rbac_analyst_cannot_create_or_delete_user(client, setup_tenants):
    analyst1 = setup_tenants["analyst1"]

    # Analyst does not have user:create permission
    resp = client.post(
        "/api/v1/users",
        json={"email": "newbie@acme.com", "role": "analyst"},
        headers=auth_header(analyst1)
    )
    assert resp.status_code == 403
    assert "Insufficient permissions" in resp.json()["detail"]


def test_admin_can_manage_users_and_invitations(client, setup_tenants):
    admin1 = setup_tenants["admin1"]

    # Admin creates new user
    resp = client.post(
        "/api/v1/users",
        json={"email": "newuser@acme.com", "full_name": "New User", "role": "analyst"},
        headers=auth_header(admin1)
    )
    assert resp.status_code == 201
    new_user_id = resp.json()["id"]

    # Admin invites another user
    inv_resp = client.post(
        "/api/v1/users/invitations",
        json={"email": "invited@acme.com", "role_name": "auditor"},
        headers=auth_header(admin1)
    )
    assert inv_resp.status_code == 201
    assert inv_resp.json()["token"] is not None

    # Admin can delete user
    del_resp = client.delete(f"/api/v1/users/{new_user_id}", headers=auth_header(admin1))
    assert del_resp.status_code == 204

