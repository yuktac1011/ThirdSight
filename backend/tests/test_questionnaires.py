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
    QuestionnaireAssignment,
    AssignmentStatus,
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
    org1 = Organization(id=str(uuid.uuid4()), name="Alpha Org", slug="alpha-org", status=OrganizationStatus.ACTIVE)
    org2 = Organization(id=str(uuid.uuid4()), name="Beta Org", slug="beta-org", status=OrganizationStatus.ACTIVE)
    db_session.add_all([org1, org2])
    db_session.flush()

    admin_role = db_session.query(Role).filter(Role.name == "admin").first()

    user_alpha = User(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        identity_subject="sub-alpha-user",
        email="admin@alpha.org",
        full_name="Alpha Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )
    user_beta = User(
        id=str(uuid.uuid4()),
        organization_id=org2.id,
        identity_subject="sub-beta-user",
        email="admin@beta.org",
        full_name="Beta Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role]
    )
    db_session.add_all([user_alpha, user_beta])
    db_session.flush()

    vendor_alpha = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org1.id,
        name="Stripe Processing",
        criticality=VendorCriticality.TIER_1,
        status=VendorStatus.ACTIVE,
        data_classification=DataClassification.RESTRICTED,
        access_level=AccessLevel.APPLICATION,
        risk_score=90,
    )
    db_session.add(vendor_alpha)
    db_session.commit()

    return {
        "org1": org1,
        "org2": org2,
        "user_alpha": user_alpha,
        "user_beta": user_beta,
        "vendor_alpha": vendor_alpha,
    }


def auth_header(user: User):
    token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# --- 1. Template Creation, Versioning, and Questions ---

def test_template_lifecycle_and_versioning(client, setup_data):
    user_alpha = setup_data["user_alpha"]

    # 1. Create Template with initial questions
    payload = {
        "title": "Cloud Security Alliance CAIQ v4",
        "description": "Standardized consensus assessments initiative questionnaire",
        "framework_tag": "CSA STAR / ISO 27001",
        "status": "draft",
        "questions": [
            {
                "order_index": 1,
                "domain": "Access Control & Identity",
                "text": "Are multi-factor authentication (MFA) mechanisms enforced for all administrative access?",
                "guidance": "Verify Duo, Okta, or hardware FIDO2 keys.",
                "question_type": "choice_partial",
                "weight": 2.0,
                "is_mandatory": True,
                "requires_evidence": True
            },
            {
                "order_index": 2,
                "domain": "Data Protection & Cryptography",
                "text": "Is customer data encrypted in transit using TLS 1.3 or higher?",
                "question_type": "yes_no",
                "weight": 1.5,
                "is_mandatory": True,
                "requires_evidence": False
            }
        ]
    }
    create_res = client.post("/api/v1/questionnaires/templates", json=payload, headers=auth_header(user_alpha))
    assert create_res.status_code == 201
    template = create_res.json()
    assert template["version"] == 1
    assert len(template["questions"]) == 2
    template_id = template["id"]

    # 2. Add question to existing template
    q_payload = {
        "order_index": 3,
        "domain": "Incident Response & Resiliency",
        "text": "Do you perform annual disaster recovery (DR) tabletop simulations?",
        "question_type": "choice_partial",
        "weight": 1.0,
        "is_mandatory": False,
        "requires_evidence": True
    }
    add_q_res = client.post(f"/api/v1/questionnaires/templates/{template_id}/questions", json=q_payload, headers=auth_header(user_alpha))
    assert add_q_res.status_code == 201

    # 3. Versioning: Branch immutable v2 of the template
    version_res = client.post(f"/api/v1/questionnaires/templates/{template_id}/version", headers=auth_header(user_alpha))
    assert version_res.status_code == 200
    v2_template = version_res.json()
    assert v2_template["version"] == 2
    assert v2_template["id"] != template_id
    assert len(v2_template["questions"]) == 3


# --- 2. Assignment & Authorization Tests ---

def test_assignment_to_vendor_and_cross_tenant_prevention(client, setup_data):
    user_alpha = setup_data["user_alpha"]
    user_beta = setup_data["user_beta"]
    vendor_alpha = setup_data["vendor_alpha"]

    # Alpha creates a template
    t_res = client.post(
        "/api/v1/questionnaires/templates",
        json={
            "title": "Vendor Quick Assessment",
            "framework_tag": "SIG Lite",
            "status": "published",
            "questions": [
                {
                    "text": "Do you maintain a SOC 2 Type II report?",
                    "question_type": "yes_no_na",
                    "domain": "Regulatory Compliance & Audit"
                }
            ]
        },
        headers=auth_header(user_alpha)
    )
    template_id = t_res.json()["id"]

    # Beta attempts to assign Alpha's template (Forbidden / Cross-tenant)
    bad_assign = client.post(
        "/api/v1/questionnaires/assignments",
        json={
            "vendor_id": vendor_alpha.id,
            "template_id": template_id,
        },
        headers=auth_header(user_beta)
    )
    assert bad_assign.status_code == 404

    # Alpha legitimately assigns template to vendor
    assign_res = client.post(
        "/api/v1/questionnaires/assignments",
        json={
            "vendor_id": vendor_alpha.id,
            "template_id": template_id,
            "notes": "Annual third-party audit cycle"
        },
        headers=auth_header(user_alpha)
    )
    assert assign_res.status_code == 201
    assignment = assign_res.json()
    assert assignment["status"] == "pending"
    assert assignment["template_version"] == 1


# --- 3. Mandatory N/A Justification Validation Tests ---

def test_answer_submission_and_na_justification_rule(client, setup_data):
    user_alpha = setup_data["user_alpha"]
    vendor_alpha = setup_data["vendor_alpha"]

    # Create template + assign
    t_res = client.post(
        "/api/v1/questionnaires/templates",
        json={
            "title": "Policy Verification",
            "framework_tag": "NIST CSF",
            "status": "published",
            "questions": [
                {
                    "text": "Are background checks conducted for all personnel?",
                    "question_type": "choice_partial",
                    "domain": "Access Control & Identity"
                }
            ]
        },
        headers=auth_header(user_alpha)
    )
    template_id = t_res.json()["id"]
    question_id = t_res.json()["questions"][0]["id"]

    a_res = client.post(
        "/api/v1/questionnaires/assignments",
        json={"vendor_id": vendor_alpha.id, "template_id": template_id},
        headers=auth_header(user_alpha)
    )
    assignment_id = a_res.json()["id"]

    # 1. Attempt to answer "na" WITHOUT justification (Must Fail 400)
    invalid_ans = client.post(
        f"/api/v1/questionnaires/assignments/{assignment_id}/answers",
        json={
            "question_id": question_id,
            "response_value": "na",
            "justification": ""
        },
        headers=auth_header(user_alpha)
    )
    assert invalid_ans.status_code == 400
    assert "mandatory" in invalid_ans.json()["detail"].lower()

    # 2. Answer "na" WITH valid justification (Must Succeed 200)
    valid_ans = client.post(
        f"/api/v1/questionnaires/assignments/{assignment_id}/answers",
        json={
            "question_id": question_id,
            "response_value": "na",
            "justification": "All personnel are contractors with distinct verification requirements handled upstream.",
            "evidence_reference": "DOC-HR-8820"
        },
        headers=auth_header(user_alpha)
    )
    assert valid_ans.status_code == 200
    assert valid_ans.json()["response_value"] == "na"

    # Verify assignment progress updated to 100% completed
    get_assign = client.get(f"/api/v1/questionnaires/assignments/{assignment_id}", headers=auth_header(user_alpha))
    assert get_assign.json()["completion_percentage"] == 100
    assert get_assign.json()["status"] == "completed"

