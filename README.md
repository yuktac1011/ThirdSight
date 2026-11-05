# Third-Party Risk Management (TPRM) Platform

A security-first platform for onboarding vendors, collecting security
evidence, assessing controls, calculating explainable risk, tracking
remediation, and producing auditable reports.

## Documentation index

-   [System architecture](docs/ARCHITECTURE.md)
-   [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
-   [Threat model](docs/THREAT_MODEL.md)
-   [Security controls](docs/SECURITY.md)
-   [Data model](docs/DATA_MODEL.md)
-   [Risk methodology](docs/RISK_METHODOLOGY.md)
-   [API specification](docs/API_SPECIFICATION.md)
-   [Deployment and operations](docs/DEPLOYMENT.md)
-   [Testing strategy](docs/TESTING.md)
-   [Implementation roadmap](docs/ROADMAP.md)

## Proposed initial stack

-   Frontend: React + TypeScript
-   API: Python + FastAPI + Pydantic
-   Database: PostgreSQL + SQLAlchemy + Alembic
-   Background jobs: Celery + Redis
-   Evidence storage: private S3-compatible object storage (MinIO
    locally)
-   Identity: OIDC provider (e.g. Keycloak)
-   Reverse proxy: Nginx
-   Runtime: Docker
-   Observability: structured logs, Prometheus and Grafana

Start as a modular monolith with isolated background workers. Split
services only when scale, ownership, or deployment needs justify it.

## Important security statement

No application can be guaranteed to be attack-proof. The objective is to
reduce attack likelihood and impact through defense in depth, secure
defaults, least privilege, continuous verification, tested recovery, and
independent security assessment.

## Status

This is an implementation blueprint, not evidence of a deployed or
certified product. Risk thresholds, control mappings, retention periods,
and compliance claims must be approved for the target organization and
jurisdiction.
