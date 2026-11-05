# Implementation Roadmap

## Phase 0 --- Design and decisions

-   Confirm user roles, tenant model, assessment lifecycle, data
    classification, and hosting constraints.
-   Approve risk methodology and control-library ownership.
-   Define RPO/RTO, retention, and security requirements.
-   Produce threat model and architecture decision records.

**Exit:** reviewed architecture, requirements, and threat model.

## Phase 1 --- Secure foundation

-   Repository and Docker development environment.
-   FastAPI application structure.
-   PostgreSQL, SQLAlchemy, and Alembic.
-   OIDC authentication and MFA policy.
-   RBAC and tenant/object authorization.
-   Organization and vendor CRUD.
-   Audit event foundation.

**Exit:** cross-tenant negative tests pass.

## Phase 2 --- Assessment workflow

-   Versioned questionnaire templates.
-   Assessment lifecycle and assignments.
-   Vendor portal.
-   Answer submission, validation, and N/A justification.
-   Workflow notifications.

**Exit:** vendor can complete an assigned questionnaire.

## Phase 3 --- Evidence pipeline

-   Private object storage.
-   Quarantine and malware scanning.
-   Isolated document extraction.
-   Evidence provenance and review workflow.
-   Outbox and idempotent background jobs.

**Exit:** safe upload-to-review workflow passes malicious-file tests.

## Phase 4 --- Risk engine

-   Versioned control library.
-   Framework mappings.
-   Deterministic scoring and explainability.
-   Gap and finding generation.
-   Remediation and risk acceptance.

**Exit:** results are reproducible and reviewed against approved
methodology.

## Phase 5 --- Reporting

-   Executive and technical report templates.
-   Assessment snapshots.
-   PDF generation in worker.
-   Report authorization and integrity hash.

**Exit:** report can be reproduced from a historical assessment version.

## Phase 6 --- AI assistance

-   Document summarization and evidence classification.
-   Structured outputs with source citations.
-   Prompt-injection evaluation.
-   Human review and override tracking.
-   Provider privacy and retention review.

**Exit:** AI remains advisory and passes the evaluation suite.

## Phase 7 --- Production hardening

-   SAST, DAST, dependency and image scanning.
-   Independent penetration test.
-   Load and failure testing.
-   Backup restoration exercise.
-   Monitoring, alerting, incident response runbook.
-   Staged deployment and rollback.

**Exit:** operational and security sign-off.

## Planning estimate

A focused MVP may take roughly 8--12 weeks for a small, experienced
team, depending on scope and availability. Production hardening and
independent assurance may extend beyond that. Treat this as a planning
estimate, not a delivery commitment.
