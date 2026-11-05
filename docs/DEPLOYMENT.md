# Deployment and Operations

## 1. Environments

Maintain separate development, staging, and production environments.
Production data must not be copied into development without an approved
anonymization process.

## 2. Container principles

-   Use minimal, pinned base images.
-   Run as a non-root user.
-   Drop unnecessary Linux capabilities.
-   Use read-only root filesystems where practical.
-   Set CPU and memory limits.
-   Do not bake secrets into images.
-   Scan images and generate an SBOM.
-   Keep API, worker, database, broker, and storage network access
    narrowly scoped.

## 3. Local deployment components

A local Docker Compose environment can include: - frontend - api -
worker - postgres - redis - minio - nginx - optional local OIDC provider

Do not expose PostgreSQL, Redis, or object storage administration ports
publicly.

## 4. Configuration

Use environment-specific configuration and a secret manager in
production. Provide `.env.example` with placeholders only. Validate
required settings at startup and fail closed if security-critical
configuration is missing.

## 5. Database migrations

-   Run Alembic migrations as a controlled deployment step.
-   Back up before risky schema changes.
-   Prefer backward-compatible expand/migrate/contract changes.
-   Do not run migrations concurrently from every API replica.
-   Test migration and rollback/recovery procedures in staging.

## 6. Backups and recovery

Define and approve: - Recovery Point Objective (RPO). - Recovery Time
Objective (RTO). - Database point-in-time recovery. - Object-storage
versioning and backup. - Encryption-key recovery. - Separate backup
credentials and administrative boundaries. - Periodic restoration
drills.

A successful backup job is not proof of recoverability; perform restore
tests.

## 7. Observability

Monitor: - API availability, latency, and error rates. - Authentication
failures and suspicious access patterns. - Database connections, locks,
replication, and storage. - Queue depth, task age, retries, and
dead-letter count. - Document scan and parsing failures. - Object
storage errors and capacity. - Report generation duration. - Tenant
quota and rate-limit events.

Alert on security-relevant events and operational SLO breaches. Keep
logs structured and redact sensitive fields.

## 8. Release process

1.  Review and merge code.
2.  Run tests, SAST, dependency and secret scans.
3.  Build and scan container images.
4.  Deploy to staging.
5.  Run integration, end-to-end, and DAST checks.
6.  Obtain production approval.
7.  Deploy gradually where supported.
8.  Verify health and key workflows.
9.  Roll back or mitigate if release checks fail.
10. Record release and change metadata.
