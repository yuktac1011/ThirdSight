# Product Requirements

## 1. Product goal

Provide a centralized, evidence-driven workflow to assess, quantify,
monitor, and mitigate third-party cybersecurity risk.

## 2. MVP scope

### Must have

1.  Organization and user management.
2.  Vendor onboarding and vendor criticality.
3.  Assessment creation and lifecycle states.
4.  Versioned questionnaire templates.
5.  Vendor answer submission and justification.
6.  Secure evidence upload and analyst review.
7.  Versioned security control library.
8.  Deterministic inherent/residual risk calculation.
9.  Findings and remediation tracking.
10. PDF report generation.
11. Tenant-scoped audit trail.

### Later releases

-   AI-assisted document classification and control mapping.
-   Framework crosswalks.
-   Continuous monitoring and reassessment reminders.
-   Vendor portfolio analytics.
-   External integrations and SSO enhancements.
-   Advanced workflow approvals.

## 3. User stories

-   As an analyst, I can register a vendor and record service/data
    criticality.
-   As an analyst, I can create an assessment from a versioned template.
-   As a vendor respondent, I can answer only assessments assigned to my
    vendor account.
-   As a vendor respondent, I can upload evidence for a specific
    question or control.
-   As an analyst, I can accept, reject, or mark evidence insufficient
    with a reason.
-   As an analyst, I can view control coverage, gaps, and risk drivers.
-   As an authorized approver, I can accept residual risk with scope,
    rationale, owner, and expiry.
-   As an auditor, I can inspect who changed an answer, evidence state,
    score, or approval and when.

## 4. Assessment lifecycle

Suggested states:

`DRAFT -> SENT -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> APPROVED`

Alternative terminal or exception states: `REJECTED`, `CANCELLED`,
`EXPIRED`.

Transitions must be explicit, authorized, validated, and audited.
Reopening an approved assessment creates a new version rather than
silently rewriting the approved record.

## 5. Non-functional requirements

-   Tenant isolation across API, database, object storage, background
    jobs, caches, and reports.
-   Secure authentication and MFA for privileged roles.
-   Encryption in transit and at rest.
-   Document processing isolated from the API runtime.
-   Recoverable database and object storage backups.
-   Observable queue failures and processing latency.
-   Accessible, responsive user interface.
-   Reproducible risk calculations and reports.
-   Configurable retention and deletion policies.
-   Defined availability, RPO, and RTO targets approved by the product
    owner.

## 6. Out of scope for MVP

-   Automatically certifying vendors as compliant.
-   Autonomous acceptance of organizational risk.
-   Unrestricted internet crawling or scanning of vendors.
-   Executing uploaded files or macros.
-   Treating questionnaire answers as verified evidence.
