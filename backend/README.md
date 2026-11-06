# ThirdSight — Backend Core Service

Enterprise-grade Third-Party Risk Management (TPRM) and Cybersecurity Intelligence platform backend powered by FastAPI, SQLAlchemy, Alembic, PostgreSQL/SQLite, and Keycloak OIDC.

---

## Architecture & Security Model

- **Multi-Tenant Isolation**: Tenant boundaries are enforced strictly through authenticated context derived from token claims (`org_id` / `sub`), never from client input.
- **Cross-Tenant Protection**: Object-level checks guarantee that users cannot read, list, modify, or delete entities belonging to another organization.
- **Role-Based Access Control (RBAC)**: Centralized fine-grained permission codes (`org:read`, `org:update`, `user:create`, `user:delete`, `user:invite`, etc.) attached to roles (`admin`, `analyst`, `auditor`, `vendor_user`).
- **OIDC / Keycloak Integration**: Supports OpenID Connect JWT tokens (RS256 JWKS validation or internal HS256 for local development/testing).

---

## Running the Backend

### Prerequisites

- Python 3.11+ / 3.13+
- Active virtualenv (`backend/venv`)

### Setup & Migrations

```bash
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux / macOS

# Seed database with baseline roles, permissions, and CyberGuard Corp demo tenant
$env:PYTHONPATH="backend"
python seed_data.py
```

### Running the API Server

```bash
$env:PYTHONPATH="backend"
uvicorn app.main:app --reload --port 8000
```

API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Running Automated Tests

The test suite validates authentication, expired tokens, tenant boundaries, and RBAC enforcement:

```bash
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

