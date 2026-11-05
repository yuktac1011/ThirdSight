# Security Requirements and Engineering Baseline

## 1. Identity and access

-   Use OIDC rather than implementing password handling from scratch
    where practical.
-   Require MFA for administrators, approvers, and other privileged
    users.
-   Use short-lived access tokens and rotate/revoke refresh tokens.
-   Enforce server-side authorization on every object operation.
-   Define roles and permissions centrally; do not trust role names
    supplied by clients.
-   Apply separation of duties to assessment review and risk acceptance.
-   Revoke access promptly when a user, vendor contact, or integration
    is disabled.

## 2. Multi-tenant isolation

-   Include `organization_id` on tenant-owned records.
-   Derive tenant context from the authenticated identity, not request
    body parameters.
-   Scope every repository query by tenant.
-   Enforce ownership checks for nested resources and object storage
    keys.
-   Consider PostgreSQL Row-Level Security as defense in depth.
-   Use separate storage prefixes/buckets and tenant-aware signed URL
    issuance.
-   Ensure cache keys and background job payloads include validated
    tenant context.
-   Test cross-tenant access for reads, writes, exports, reports, and
    deletes.

## 3. API controls

-   Validate inputs using strict schemas and bounded lengths.
-   Use parameterized SQL.
-   Set request body, upload, pagination, and execution limits.
-   Apply per-user, per-IP, and per-tenant rate limits as appropriate.
-   Restrict CORS to known origins.
-   Use secure headers and a Content Security Policy.
-   Avoid exposing stack traces, secrets, internal paths, or database
    errors.
-   Use idempotency keys for operations where retries could duplicate
    effects.
-   Record correlation IDs without logging sensitive payloads.

## 4. File and document handling

-   Allowlist formats required by the product.
-   Verify file signatures; do not trust filename or Content-Type alone.
-   Generate random object keys; preserve the original filename only as
    sanitized metadata.
-   Upload to quarantine before scanning or parsing.
-   Scan for malware and apply parser isolation with CPU, memory, time,
    and file-size limits.
-   Disable macros and never execute uploaded content.
-   Limit PDF pages, archive depth, decompressed size, and embedded
    objects.
-   Keep storage private; use short-lived, narrowly scoped download URLs
    when necessary.
-   Prevent path traversal and unsafe archive extraction.
-   Retain hashes and processing provenance for evidence integrity.

## 5. AI safety

-   Treat extracted text as untrusted data, not instructions.
-   Do not grant the model tools that can approve vendors, change
    permissions, or modify risk policy.
-   Use a narrow task and structured output schema.
-   Require source references such as document ID and page number.
-   Validate references and output values server-side.
-   Record model/provider/version and prompt-template version where
    appropriate.
-   Require analyst review before AI output becomes an accepted control
    result.
-   Define data-processing restrictions before sending confidential
    evidence to an external model provider.

## 6. Secrets and cryptography

-   Never commit secrets to source control or container images.
-   Use a secrets manager or protected deployment secrets.
-   Rotate credentials and document emergency rotation procedures.
-   Use TLS for all network paths that carry sensitive data.
-   Use managed encryption at rest for database, backups, and object
    storage.
-   Separate keys from encrypted data and restrict key access.
-   Prefer well-maintained cryptographic libraries and standard
    algorithms.

## 7. Audit and privacy

Audit events should include actor, tenant, action, target, timestamp,
outcome, request/correlation ID, and relevant before/after references.
Avoid storing secrets or unnecessary personal data.

Protect audit records from ordinary application update/delete
operations. Export to tamper-resistant storage and periodically verify
integrity. Define retention, legal hold, deletion, and data-subject
processes with the organization.

## 8. Secure development

-   Code review for security-sensitive changes.
-   Dependency and container image scanning.
-   Secret scanning.
-   SAST and DAST in CI/CD.
-   Pinned dependencies and controlled upgrades.
-   SBOM generation for releases.
-   Signed, traceable release artifacts where feasible.
-   Documented vulnerability disclosure and patch process.
