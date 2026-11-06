import uuid
from app.core.database import SessionLocal, Base, engine
from app.core.models import Organization, User, Role, OrganizationStatus, UserStatus
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
                status=OrganizationStatus.ACTIVE
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
                roles=[admin_role]
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
                roles=[analyst_role]
            )
            db.add(analyst_user)

        db.commit()
        print("Successfully seeded CyberGuard Global Corp and demo users.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_data()

