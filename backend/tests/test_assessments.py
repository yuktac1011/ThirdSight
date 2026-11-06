import pytest
import uuid
from datetime import datetime, timezone
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
    QuestionnaireTemplate,
    Question,
    QuestionType,
    SecurityDomain,
    TemplateStatus,
    Assessment,
    AssessmentStatus,
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
    org1 = Organization(id=str(uuid.uuid4()), name="Org Prime", slug="org-prime", status=OrganizationStatus.ACTIVE)
    org2 = Organization(id=str(uuid.uuid4()), name="Org Secondary", slug="org-sec", status=OrganizationStatus.ACTIVE)
    db_session.add_all([org1, org2])
    db_session.flush()

    admin_role = db_session.query(Role).filter(Role.name == "admin").first()

    analyst_user = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-analyst",
        email="analyst@prime.org",
        full_name="Prime Analyst",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )
    external_user = User(
        id=str(uuid.uuid4()),
        organization_id=org2.id,
        identity_subject="sub-external",
        email="user@secondary.org",
        full_name="External User",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )
    db_session.add_all([analyst_user, external_user])
    db_session.flush()

    vendor = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        name="AWS Cloud Services",
        criticality=VendorCriticality.TIER_1,
        status=VendorStatus.ACTIVE,
        data_classification=DataClassification.CONFIDENTIAL,
        access_level=AccessLevel.ADMINISTRATIVE,
        risk_score=80,
    )
    db_session.add(vendor)
    db_session.flush()

    template = QuestionnaireTemplate(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        title="NIST CSF 2.0 Assessment",
        framework_tag="NIST CSF",
        status=TemplateStatus.PUBLISHED,
        version=1,
    )
    db_session.add(template)
    db_session.flush()

    q1 = Question(
        id=str(uuid.uuid4()),
        template_id=template.id,
        order_index=1,
        domain=SecurityDomain.ACCESS_CONTROL,
        text="Is MFA strictly enforced across all cloud console access?",
        question_type=QuestionType.CHOICE_PARTIAL,
        weight=2.0,
        is_mandatory=True,
    )
    q2 = Question(
        id=str(uuid.uuid4()),
        template_id=template.id,
        order_index=2,
        domain=SecurityDomain.DATA_PROTECTION,
        text="Is customer data encrypted using customer-managed keys (CMK)?",
        question_type=QuestionType.CHOICE_PARTIAL,
        weight=2.0,
        is_mandatory=True,
    )
    db_session.add_all([q1, q2])
    db_session.commit()

    return {
        "org1": org1,
        "org2": org2,
        "user": analyst_user,
        "external_user": external_user,
        "vendor": vendor,
        "template": template,
        "q1": q1,
        "q2": q2,
    }


def auth_header(user: User):
    token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# --- 1. Assessment Lifecycle & State Transitions ---

def test_assessment_full_lifecycle(client, setup_data):
    user = setup_data["user"]
    vendor = setup_data["vendor"]
    template = setup_data["template"]
    q1 = setup_data["q1"]
    q2 = setup_data["q2"]

    # 1. Initiate Assessment
    init_payload = {
        "vendor_id": vendor.id,
        "template_id": template.id,
        "scope": "SOC 2 & Cloud Security Audit",
        "assigned_respondent_email": "ciso@aws-security.com"
    }
    init_res = client.post("/api/v1/assessments", json=init_payload, headers=auth_header(user))
    assert init_res.status_code == 201
    assessment = init_res.json()
    assessment_id = assessment["id"]
    assert assessment["status"] == "assigned"
    assert assessment["is_locked"] is False

    # 2. Answer Question 1 (Draft / In Progress)
    ans1_res = client.post(
        f"/api/v1/assessments/{assessment_id}/answers",
        json={
            "question_id": q1.id,
            "response_value": "yes",
            "evidence_reference": "AWS-IAM-POLICY-01"
        },
        headers=auth_header(user)
    )
    assert ans1_res.status_code == 200

    # Verify status automatically transitioned to IN_PROGRESS
    get_res = client.get(f"/api/v1/assessments/{assessment_id}", headers=auth_header(user))
    assert get_res.json()["status"] == "in_progress"

    # 3. Attempt to submit before mandatory Question 2 is answered (Must Fail 400)
    premature_submit = client.post(f"/api/v1/assessments/{assessment_id}/submit", headers=auth_header(user))
    assert premature_submit.status_code == 400
    assert "mandatory" in premature_submit.json()["detail"].lower()

    # 4. Answer Question 2
    ans2_res = client.post(
        f"/api/v1/assessments/{assessment_id}/answers",
        json={
            "question_id": q2.id,
            "response_value": "partial",
            "justification": "CMK available on enterprise plan, standard uses AWS managed keys."
        },
        headers=auth_header(user)
    )
    assert ans2_res.status_code == 200

    # 5. Submit for Analyst Review
    submit_res = client.post(f"/api/v1/assessments/{assessment_id}/submit", headers=auth_header(user))
    assert submit_res.status_code == 200
    submitted = submit_res.json()
    assert submitted["status"] == "submitted"
    assert submitted["is_locked"] is True
    assert submitted["score"] is not None

    # 6. Verify answers are locked (Cannot modify submitted answers)
    locked_attempt = client.post(
        f"/api/v1/assessments/{assessment_id}/answers",
        json={"question_id": q1.id, "response_value": "no"},
        headers=auth_header(user)
    )
    assert locked_attempt.status_code == 400
    assert "locked" in locked_attempt.json()["detail"].lower()

    # 7. Analyst Review: Approve assessment
    review_res = client.post(
        f"/api/v1/assessments/{assessment_id}/review",
        json={"action": "approve", "review_notes": "All controls adequately addressed."},
        headers=auth_header(user)
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"
    assert len(review_res.json()["history"]) >= 4


# --- 2. Tenant Isolation & IDOR Protection ---

def test_assessment_tenant_isolation(client, setup_data):
    user = setup_data["user"]
    external_user = setup_data["external_user"]
    vendor = setup_data["vendor"]
    template = setup_data["template"]

    # Org Prime creates assessment
    res = client.post(
        "/api/v1/assessments",
        json={"vendor_id": vendor.id, "template_id": template.id, "scope": "Internal Audit"},
        headers=auth_header(user)
    )
    assessment_id = res.json()["id"]

    # External user (Org Secondary) attempts to read assessment (IDOR protection)
    forbidden_get = client.get(f"/api/v1/assessments/{assessment_id}", headers=auth_header(external_user))
    assert forbidden_get.status_code == 404

    # External user lists assessments (Zero cross-tenant leakage)
    list_res = client.get("/api/v1/assessments", headers=auth_header(external_user))
    assert list_res.status_code == 200
    assert assessment_id not in [a["id"] for a in list_res.json()]

