import pytest
import io
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.init_db import seed_roles_and_permissions
from app.core.init_controls import seed_security_controls_and_frameworks
from app.core.models import (
    Organization,
    User,
    Vendor,
    VendorCriticality,
    VendorStatus,
    DataClassification,
    AccessLevel,
    Assessment,
    AssessmentStatus,
    Evidence,
    EvidenceStatus,
)
from app.core.security import create_access_token
from app.features.reports.engine import generate_risk_assessment_pdf
from app.main import app

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
def test_environment(db_session):
    org = Organization(id=str(uuid.uuid4()), name=f"Report Org {uuid.uuid4().hex[:6]}", slug=f"rep-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    db_session.flush()

    from app.core.models import Role
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()

    analyst = User(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        email=f"reporter-{uuid.uuid4().hex[:6]}@test.org",
        identity_subject=f"sub-rep-{uuid.uuid4().hex[:6]}",
        roles=[admin_role],
    )
    db_session.add(analyst)

    vendor = Vendor(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        name=f"Vendor Dossier {uuid.uuid4().hex[:6]}",
        criticality=VendorCriticality.TIER_1,
        status=VendorStatus.ACTIVE,
        data_classification=DataClassification.CONFIDENTIAL,
        access_level=AccessLevel.NETWORK,
    )
    db_session.add(vendor)

    assessment = Assessment(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        vendor_id=vendor.id,
        template_id=str(uuid.uuid4()),
        version=1,
        status=AssessmentStatus.APPROVED,
        score=92.5,
        scope="SOC 2 Type II Annual Audit",
    )
    db_session.add(assessment)
    db_session.commit()

    token = create_access_token({"sub": analyst.identity_subject, "email": analyst.email, "org_id": org.id})
    return {"org": org, "analyst": analyst, "vendor": vendor, "assessment": assessment, "token": token}


def test_pdf_engine_valid_stream_generation():
    """Verify standard PDF generation and structural integrity"""
    pdf_bytes = generate_risk_assessment_pdf(
        report_title="Executive Risk Assessment Dossier",
        vendor_name="Acme Cloud Services",
        assessment_scope="Production API Infrastructure",
        status="APPROVED",
        score=88.5,
        inherent_score=15,
        residual_score=6,
        risk_band="medium",
        findings=[{"title": "MFA gap on staging database", "severity": "medium", "status": "open"}],
        generated_by="auditor@cyberguard.internal",
        report_type="executive",
    )
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert b"%%EOF" in pdf_bytes
    assert b"Acme Cloud Services" in pdf_bytes


def test_report_generation_and_download_api(client, test_environment):
    token = test_environment["token"]
    assessment = test_environment["assessment"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Generate Report
    gen_payload = {
        "assessment_id": assessment.id,
        "report_type": "executive",
    }
    gen_res = client.post("/api/v1/reports/generate", headers=headers, json=gen_payload)
    assert gen_res.status_code == 201
    report = gen_res.json()
    assert report["report_type"] == "executive"
    assert len(report["sha256_hash"]) == 64

    rep_id = report["id"]

    # 2. List Reports
    list_res = client.get("/api/v1/reports", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Download Report PDF
    dl_res = client.get(f"/api/v1/reports/{rep_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert dl_res.content.startswith(b"%PDF-1.4")


def test_notifications_and_audit_export_api(client, test_environment, db_session):
    token = test_environment["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add an expiring evidence item to trigger auto-alerting
    exp_evidence = Evidence(
        id=str(uuid.uuid4()),
        organization_id=test_environment["org"].id,
        vendor_id=test_environment["vendor"].id,
        file_name="expiring_iso_cert.pdf",
        file_size=1024,
        mime_type="application/pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_key="approved/cert.pdf",
        status=EvidenceStatus.APPROVED,
        expires_at=datetime.now(timezone.utc) + timedelta(days=10),
    )
    db_session.add(exp_evidence)
    db_session.commit()

    # 1. Fetch Notifications (should auto-generate expiry alert)
    notif_res = client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) >= 1
    exp_notif = next(n for n in notifs if "expiring_iso_cert" in n["title"])
    assert exp_notif["is_read"] is False

    # 2. Mark Notification as read
    read_res = client.patch(f"/api/v1/notifications/{exp_notif['id']}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # 3. Generate a report in this test to record an audit event
    gen_payload = {
        "assessment_id": test_environment["assessment"].id,
        "report_type": "executive",
    }
    client.post("/api/v1/reports/generate", headers=headers, json=gen_payload)

    # 4. Fetch Audit Trail
    audit_res = client.get("/api/v1/audit/events", headers=headers)
    assert audit_res.status_code == 200
    events = audit_res.json()
    assert len(events) >= 1
    assert any(e["action"] == "report.generate" for e in events)
