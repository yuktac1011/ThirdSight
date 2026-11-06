import pytest
import io
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.init_db import seed_roles_and_permissions
from app.core.init_controls import seed_security_controls_and_frameworks
from app.core.models import Organization, User, Vendor, VendorCriticality, VendorStatus, DataClassification, AccessLevel, Assessment, AssessmentStatus, SecurityControl, Framework
from app.core.security import create_access_token
from app.features.evidence.validator import EICAR_STANDARD_VIRUS_SIG
from app.main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_roles_and_permissions(db)
    seed_security_controls_and_frameworks(db)
    db.close()


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


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
def test_org_and_users(db_session):
    org = Organization(id=str(uuid.uuid4()), name=f"Evidence Test Org {uuid.uuid4().hex[:6]}", slug=f"ev-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    db_session.flush()

    from app.core.models import Role
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()

    analyst = User(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        email=f"analyst-{uuid.uuid4().hex[:6]}@evidence-test.org",
        identity_subject=f"sub-{uuid.uuid4().hex[:8]}",
        roles=[admin_role],
    )
    db_session.add(analyst)

    vendor = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        name=f"Vendor {uuid.uuid4().hex[:6]}",
        criticality=VendorCriticality.TIER_1,
        status=VendorStatus.ACTIVE,
        data_classification=DataClassification.CONFIDENTIAL,
        access_level=AccessLevel.DATABASE,
    )
    db_session.add(vendor)
    db_session.commit()

    token = create_access_token({"sub": analyst.identity_subject, "email": analyst.email, "org_id": org.id})
    return {"org": org, "analyst": analyst, "vendor": vendor, "token": token}


def test_evidence_valid_pdf_upload_and_review(client, test_org_and_users):
    token = test_org_and_users["token"]
    vendor_id = test_org_and_users["vendor"].id
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid PDF
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Title (SOC 2 Type II Report) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    files = {"file": ("soc2_audit.pdf", io.BytesIO(pdf_content), "application/pdf")}
    data = {"vendor_id": vendor_id}

    res = client.post("/api/v1/evidence/upload", headers=headers, data=data, files=files)
    assert res.status_code == 201
    evidence = res.json()
    assert evidence["status"] == "approved"
    assert evidence["file_name"] == "soc2_audit.pdf"
    assert len(evidence["sha256_hash"]) == 64

    ev_id = evidence["id"]

    # Review evidence - approve
    rev_res = client.post(
        f"/api/v1/evidence/{ev_id}/review",
        headers=headers,
        json={"action": "approve"},
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "approved"

    # Review evidence - reject with reason
    rej_res = client.post(
        f"/api/v1/evidence/{ev_id}/review",
        headers=headers,
        json={"action": "reject", "rejection_reason": "expired_certificate", "rejection_comment": "Audit covers 2024; need 2025-2026 report."},
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"
    assert rej_res.json()["rejection_reason"] == "expired_certificate"

    # Download evidence
    dl_res = client.get(f"/api/v1/evidence/{ev_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.content == pdf_content


def test_evidence_malicious_and_spoofed_file_rejection(client, test_org_and_users):
    token = test_org_and_users["token"]
    vendor_id = test_org_and_users["vendor"].id
    headers = {"Authorization": f"Bearer {token}"}

    # 1. MIME Spoofing: .pdf extension with non-PDF binary bytes
    spoofed = b"This is not a PDF at all"
    files = {"file": ("fake.pdf", io.BytesIO(spoofed), "application/pdf")}
    res = client.post("/api/v1/evidence/upload", headers=headers, data={"vendor_id": vendor_id}, files=files)
    assert res.status_code == 201
    assert res.json()["status"] == "rejected"
    assert res.json()["rejection_reason"] == "mime_mismatch"

    # 2. Antivirus EICAR signature test payload
    eicar_files = {"file": ("virus_sample.txt", io.BytesIO(EICAR_STANDARD_VIRUS_SIG), "text/plain")}
    eicar_res = client.post("/api/v1/evidence/upload", headers=headers, data={"vendor_id": vendor_id}, files=eicar_files)
    assert eicar_res.status_code == 201
    assert eicar_res.json()["status"] == "rejected"
    assert eicar_res.json()["rejection_reason"] == "malicious_payload"


def test_security_controls_and_framework_evaluation(client, test_org_and_users, db_session):
    token = test_org_and_users["token"]
    org_id = test_org_and_users["org"].id
    vendor_id = test_org_and_users["vendor"].id
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List Frameworks
    fw_res = client.get("/api/v1/controls/frameworks", headers=headers)
    assert fw_res.status_code == 200
    fws = fw_res.json()
    assert len(fws) >= 3
    fw_names = [f["name"] for f in fws]
    assert "NIST CSF 2.0" in fw_names
    assert "ISO/IEC 27001:2022" in fw_names

    # 2. List Controls
    ctrl_res = client.get("/api/v1/controls", headers=headers)
    assert ctrl_res.status_code == 200
    controls = ctrl_res.json()
    assert len(controls) >= 8
    ac01 = next(c for c in controls if c["code"] == "AC-01")
    assert len(ac01["mappings"]) >= 3

    # 3. Create an assessment to evaluate controls against
    assessment = Assessment(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        vendor_id=vendor_id,
        template_id=str(uuid.uuid4()),
        version=1,
        status=AssessmentStatus.IN_PROGRESS,
        scope="Cloud Infrastructure Assessment",
    )
    db_session.add(assessment)
    db_session.commit()

    # 4. Evaluate Control
    eval_payload = {
        "effectiveness": "effective",
        "rationale": "MFA verified via Okta and WebAuthn hardware keys.",
        "evidence_ids": []
    }
    eval_res = client.post(
        f"/api/v1/controls/assessments/{assessment.id}/evaluate/{ac01['id']}",
        headers=headers,
        json=eval_payload,
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["effectiveness"] == "effective"
    assert eval_data["control_code"] == "AC-01"

    # 5. Check Framework Coverage Metric
    cov_res = client.get(f"/api/v1/controls/assessments/{assessment.id}/coverage", headers=headers)
    assert cov_res.status_code == 200
    coverage = cov_res.json()
    assert len(coverage) >= 3
    nist = next(c for c in coverage if c["framework_name"] == "NIST CSF 2.0")
    assert nist["evaluated_controls"] >= 1
