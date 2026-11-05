# System Architecture

## 1. Purpose

The platform manages third-party security assessments from vendor
onboarding through evidence review, risk decisions, remediation, and
reporting.

## 2. Actors

-   **Organization administrator:** configures the tenant, users, roles,
    and policies.
-   **Risk analyst:** creates assessments, reviews evidence, evaluates
    controls, and drafts findings.
-   **Approver:** accepts or rejects residual-risk decisions within
    delegated authority.
-   **Vendor respondent:** submits questionnaire answers and evidence
    only for assigned assessments.
-   **Auditor:** reads authorized assessment history and audit records.

## 3. Logical architecture

``` mermaid
flowchart TB
  subgraph Clients
    A[Analyst Dashboard]
    B[Vendor Portal]
  end
  subgraph Edge
    C[Nginx / TLS]
    D[OIDC Authentication]
    E[Rate Limits and Request Limits]
  end
  subgraph Application
    F[FastAPI API]
    G[Tenant and Object Authorization]
    H[Vendor and Assessment Modules]
    I[Questionnaire and Control Modules]
    J[Risk and Remediation Modules]
    K[Reporting and Audit Modules]
  end
  subgraph Async
    L[Redis Broker]
    M[Celery Workers]
    N[Isolated Document Extraction]
    O[PDF Report Worker]
  end
  subgraph Data
    P[(PostgreSQL)]
    Q[(Private Object Storage)]
    R[(Append-only Audit Export)]
  end
  A --> C
  B --> C
  C --> D --> E --> F --> G
  G --> H
  G --> I
  G --> J
  G --> K
  H --> P
  I --> P
  J --> P
  K --> P
  F --> Q
  F --> L --> M
  M --> N
  M --> O
  N --> Q
  O --> Q
  K --> R
```

## 4. Deployment shape

Use a modular monolith initially:

-   One API application with clearly separated domain modules.
-   Separate worker process/container for asynchronous work.
-   PostgreSQL for transactional records.
-   Redis for queue/broker and carefully scoped caching.
-   Private object storage for uploaded evidence and generated reports.
-   OIDC identity provider for authentication.
-   Nginx or managed ingress for TLS, routing, and request-size limits.

Do not introduce microservices or Kubernetes until there is a
demonstrated operational need.

## 5. Core request flow: evidence upload

1.  Authenticated vendor submits an upload request.
2.  API checks tenant, assessment assignment, object-level permission,
    quota, and upload limits.
3.  API validates extension, declared MIME type, file signature, and
    allowed format.
4.  File is stored in a quarantine bucket/prefix under a random object
    key.
5.  A database record and outbox event are committed transactionally.
6.  Worker scans and parses the file in a restricted environment.
7.  Clean, successfully processed files are promoted to approved private
    storage.
8.  Extraction results are stored with page/section provenance.
9.  Analyst reviews evidence and records a decision.
10. Every state transition is audited.

## 6. Trust boundaries

-   Browser to edge proxy.
-   Edge proxy to API.
-   API to identity provider.
-   API to database.
-   API to object storage.
-   Queue producer to worker.
-   Worker to document parser and optional AI provider.
-   Tenant users to shared application resources.

Treat all vendor-provided content, filenames, documents, URLs, and AI
outputs as untrusted.

## 7. Architecture decisions

-   Use UUIDs as identifiers, never as authorization.
-   Enforce tenant and object authorization on every read and write.
-   Keep risk calculation deterministic and versioned.
-   Keep AI advisory; require human approval for material decisions.
-   Store files outside the web root and never expose public object
    URLs.
-   Use an outbox pattern for reliable asynchronous events.
-   Keep assessment snapshots so old reports remain reproducible.
