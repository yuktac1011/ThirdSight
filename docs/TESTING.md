# Testing and Security Verification

## 1. Test layers

### Unit tests

-   Risk calculations and boundaries.
-   Assessment state transitions.
-   Permission policy functions.
-   Evidence state transitions.
-   Input normalization and validation.

### Integration tests

-   API with PostgreSQL.
-   Tenant scoping and database RLS.
-   Redis/Celery task dispatch.
-   Object storage upload/download.
-   Outbox publication and retry behavior.

### End-to-end tests

-   Vendor onboarding to report generation.
-   Vendor answer and evidence submission.
-   Analyst review and approval.
-   Remediation closure and reassessment.

## 2. Authorization test matrix

Create at least two tenants with separate users, vendors, assessments,
findings, and evidence.

For every resource type, test: - Tenant A reads Tenant B object. -
Tenant A updates Tenant B object. - Tenant A deletes Tenant B object. -
Tenant A exports Tenant B object. - Tenant A downloads Tenant B
evidence/report. - Vendor respondent accesses another vendor's
assessment. - Reviewer attempts an approval beyond their authority.

All unauthorized operations must fail without leaking sensitive data.

## 3. File-processing tests

Test: - Valid supported files. - Spoofed MIME type and extension. -
Truncated/corrupt documents. - Oversized files. - Password-protected
files. - Malformed PDFs and Office files. - Archive bombs and nested
archives. - Embedded objects and macros. - Malware test samples in a
controlled test environment.

Verify quarantine, scan, parser isolation, timeouts, cleanup, and audit
events.

## 4. Application security tests

Use an approved test environment to verify: - SQL injection. - XSS and
unsafe HTML rendering. - CSRF where applicable. - SSRF in any
URL-fetching feature. - BOLA/IDOR. - Authentication and session
weaknesses. - Rate-limit bypass and resource exhaustion. - Security
headers and TLS configuration. - Secrets exposure and dependency
vulnerabilities.

## 5. AI evaluation

Create a fixed evaluation set containing: - Normal policies and audit
reports. - Missing or contradictory evidence. - Expired documents. -
Irrelevant documents. - Prompt-injection instructions embedded in
documents. - Attempts to induce unsupported compliance claims.

Measure extraction accuracy, citation correctness, unsupported-claim
rate, and reviewer override rate. AI output must remain advisory.

## 6. Reliability tests

-   Load test concurrent assessments and uploads.
-   Kill workers during processing and verify safe retries.
-   Simulate Redis outage and broker recovery.
-   Restore database and object-storage backups.
-   Verify idempotency and duplicate prevention.
-   Test report regeneration from stored assessment snapshots.

## 7. Release gates

Do not release with unresolved critical/high vulnerabilities, failed
tenant-isolation tests, untested backup restoration, or unexplained
risk-score changes.
