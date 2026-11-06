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
        existing_vendor_count = db.query(Vendor).filter(Vendor.organization_id == org.id).count()
        if existing_vendor_count == 0:
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

            v3 = Vendor(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="OmniAnalytics Data Labs",
                website="https://omnidata.io",
                industry="Big Data & ML",
                service_category="Analytics & BI",
                service_description="Customer journey analytics pipeline and marketing reporting.",
                criticality=VendorCriticality.TIER_2,
                status=VendorStatus.ACTIVE,
                data_classification=DataClassification.INTERNAL,
                access_level=AccessLevel.DATABASE,
                risk_score=91,
            )
            v3_contact = VendorContact(
                id=str(uuid.uuid4()),
                vendor_id=v3.id,
                name="David Chen",
                email="dchen@omnidata.io",
                phone="+1-555-442-990",
                title="Customer Security Manager",
                is_primary=True,
            )

            v4 = Vendor(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="LogiHost Mesh Solutions",
                website="https://logihost-mesh.net",
                industry="Telecommunications",
                service_category="CDN & DNS",
                service_description="Edge content delivery and DDoS mitigation proxy.",
                criticality=VendorCriticality.TIER_3,
                status=VendorStatus.MONITORED,
                data_classification=DataClassification.PUBLIC,
                access_level=AccessLevel.NETWORK,
                risk_score=48,
            )

            db.add_all([v1, v1_contact, v2, v2_contact, v3, v3_contact, v4])

        db.commit()
        print("Successfully seeded CyberGuard Global Corp, demo users, and realistic vendor inventory.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_data()
