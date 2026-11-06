import uuid
from app.core.database import SessionLocal, Base, engine
from app.core.models import (
    Organization,
    User,
    Role,
    OrganizationStatus,
    UserStatus,
    Vendor,
    VendorContact,
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
    Assessment,
    AssessmentHistory,
    AssessmentStatus as AsmStatus,
)
from app.core.init_db import seed_roles_and_permissions


def seed_dev_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_roles_and_permissions(db)

        # Create demo enterprise organization
        org = db.query(Organization).filter(Organization.slug == "cyberguard-corp").first()
        if not org:
            org = Organization(
                id=str(uuid.uuid4()),
                name="CyberGuard Global Corp",
                slug="cyberguard-corp",
                status=OrganizationStatus.ACTIVE,
            )
            db.add(org)
            db.flush()

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        analyst_role = db.query(Role).filter(Role.name == "analyst").first()

        # Create demo admin
        admin_user = db.query(User).filter(User.email == "admin@cyberguard.internal").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                identity_subject="sub-admin-seed",
                email="admin@cyberguard.internal",
                full_name="Alex Vance (SecOps Director)",
                status=UserStatus.ACTIVE,
                roles=[admin_role],
            )
            db.add(admin_user)

        # Create demo analyst
        analyst_user = db.query(User).filter(User.email == "analyst@cyberguard.internal").first()
        if not analyst_user:
            analyst_user = User(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                identity_subject="sub-analyst-seed",
                email="analyst@cyberguard.internal",
                full_name="Morgan Reed (Security Analyst)",
                status=UserStatus.ACTIVE,
                roles=[analyst_role],
            )
            db.add(analyst_user)

        # Seed initial enterprise vendors for CyberGuard Corp
        v1 = db.query(Vendor).filter(Vendor.organization_id == org.id, Vendor.name == "CloudScale Infrastructure").first()
        if not v1:
            v1 = Vendor(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="CloudScale Infrastructure",
                website="https://cloudscale.internal",
                industry="Cloud Computing",
                service_category="IaaS / Hosting",
                service_description="Primary European Kubernetes and cloud storage provider.",
                criticality=VendorCriticality.TIER_1,
                status=VendorStatus.ACTIVE,
                data_classification=DataClassification.CONFIDENTIAL,
                access_level=AccessLevel.ADMINISTRATIVE,
                risk_score=84,
            )
            v1_contact = VendorContact(
                id=str(uuid.uuid4()),
                vendor_id=v1.id,
                name="Marcus Sterling",
                email="m.sterling@cloudscale.internal",
                phone="+1-555-839-201",
                title="Lead Security Architect",
                is_primary=True,
            )
            db.add_all([v1, v1_contact])

        v2 = db.query(Vendor).filter(Vendor.organization_id == org.id, Vendor.name == "PayBridge Gateways Inc").first()
        if not v2:
            v2 = Vendor(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="PayBridge Gateways Inc",
                website="https://paybridge-api.com",
                industry="Financial technology",
                service_category="Payment Gateway",
                service_description="Credit card tokenization and checkout processing API.",
                criticality=VendorCriticality.TIER_1,
                status=VendorStatus.UNDER_REVIEW,
                data_classification=DataClassification.RESTRICTED,
                access_level=AccessLevel.APPLICATION,
                risk_score=62,
            )
            v2_contact = VendorContact(
                id=str(uuid.uuid4()),
                vendor_id=v2.id,
                name="Elena Rostova",
                email="compliance@paybridge-api.com",
                phone="+1-555-321-778",
                title="VP Compliance & Risk",
                is_primary=True,
            )
            db.add_all([v2, v2_contact])

        # Seed standard security questionnaire templates if none exist
        t1 = db.query(QuestionnaireTemplate).filter(QuestionnaireTemplate.organization_id == org.id).first()
        if not t1:
            t1 = QuestionnaireTemplate(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                title="Standard Information Gathering (SIG Lite 2026)",
                description="Comprehensive third-party vendor baseline risk assessment evaluating access controls, encryption, and business continuity.",
                framework_tag="SIG Lite / ISO 27001",
                status=TemplateStatus.PUBLISHED,
                version=1,
            )
            db.add(t1)
            db.flush()

            q1 = Question(
                id=str(uuid.uuid4()),
                template_id=t1.id,
                order_index=1,
                domain=SecurityDomain.ACCESS_CONTROL,
                text="Is Multi-Factor Authentication (MFA) strictly enforced for all administrative and remote employee access?",
                guidance="Provide details on authentication enforcement methods (e.g., FIDO2 hardware keys, authenticator app).",
                question_type=QuestionType.CHOICE_PARTIAL,
                weight=2.0,
                is_mandatory=True,
                requires_evidence=True,
            )
            q2 = Question(
                id=str(uuid.uuid4()),
                template_id=t1.id,
                order_index=2,
                domain=SecurityDomain.DATA_PROTECTION,
                text="Is all confidential and sensitive customer data encrypted at rest using AES-256 or stronger?",
                guidance="Confirm KMS architecture, key rotation cadence, and envelope encryption policies.",
                question_type=QuestionType.CHOICE_PARTIAL,
                weight=2.0,
                is_mandatory=True,
                requires_evidence=True,
            )
            q3 = Question(
                id=str(uuid.uuid4()),
                template_id=t1.id,
                order_index=3,
                domain=SecurityDomain.VULNERABILITY_MGMT,
                text="Are independent third-party penetration tests executed at least annually against all production systems?",
                guidance="Attach the executive summary or letter of attestation from your most recent assessment.",
                question_type=QuestionType.CHOICE_PARTIAL,
                weight=1.5,
                is_mandatory=True,
                requires_evidence=True,
            )
            q4 = Question(
                id=str(uuid.uuid4()),
                template_id=t1.id,
                order_index=4,
                domain=SecurityDomain.INCIDENT_RESPONSE,
                text="Do you maintain a documented Incident Response plan that guarantees critical security breach notification within 24 hours?",
                guidance="Outline escalation paths and regulatory SLA notification commitments.",
                question_type=QuestionType.YES_NO,
                weight=1.5,
                is_mandatory=True,
                requires_evidence=False,
            )
            db.add_all([q1, q2, q3, q4])

        # Seed initial Assessment for PayBridge Gateways
        asm_count = db.query(Assessment).filter(Assessment.organization_id == org.id).count()
        if asm_count == 0 and v2 and t1:
            asm1 = Assessment(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                vendor_id=v2.id,
                template_id=t1.id,
                version=1,
                status=AsmStatus.IN_PROGRESS,
                scope="Annual Tier-1 Payment Tokenization Audit",
                assigned_respondent_email="compliance@paybridge-api.com",
                is_locked=False,
            )
            db.add(asm1)
            db.flush()

            h1 = AssessmentHistory(
                id=str(uuid.uuid4()),
                assessment_id=asm1.id,
                from_status=None,
                to_status=AsmStatus.ASSIGNED.value,
                actor_email="admin@cyberguard.internal",
                comment="Assessment assigned to PayBridge compliance team",
            )
            h2 = AssessmentHistory(
                id=str(uuid.uuid4()),
                assessment_id=asm1.id,
                from_status=AsmStatus.ASSIGNED.value,
                to_status=AsmStatus.IN_PROGRESS.value,
                actor_email="compliance@paybridge-api.com",
                comment="Vendor respondent saved draft controls",
            )
            db.add_all([h1, h2])

        db.commit()
        print("Successfully seeded CyberGuard Corp templates, questions, and assessments.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_data()
