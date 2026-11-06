from sqlalchemy.orm import Session
from app.core.models import Role, Permission
from app.core.security import STANDARD_ROLES_PERMISSIONS


def seed_roles_and_permissions(db: Session):
    # Collect all unique permissions
    all_perm_codes = set()
    for perms in STANDARD_ROLES_PERMISSIONS.values():
        all_perm_codes.update(perms)

    existing_perms = {p.code: p for p in db.query(Permission).all()}
    for code in all_perm_codes:
        if code not in existing_perms:
            new_perm = Permission(code=code, description=f"Permission for {code}")
            db.add(new_perm)
            existing_perms[code] = new_perm
    db.commit()

    # Create roles and associate permissions
    existing_roles = {r.name: r for r in db.query(Role).all()}
    for role_name, perms in STANDARD_ROLES_PERMISSIONS.items():
        if role_name not in existing_roles:
            role_obj = Role(name=role_name, description=f"Built-in {role_name} role")
            db.add(role_obj)
            db.flush()
            existing_roles[role_name] = role_obj
        else:
            role_obj = existing_roles[role_name]

        # Link permissions
        role_obj.permissions = [existing_perms[p] for p in perms if p in existing_perms]

    db.commit()

