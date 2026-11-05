# Threat Model

## 1. Scope and assumptions

The platform stores sensitive vendor security information, assessment
findings, and reports. It is multi-tenant and accepts untrusted files
and text from external vendor users.

Primary security objectives: confidentiality, integrity, availability,
tenant isolation, accountability, and evidence provenance.

## 2. Assets

-   Tenant and user identities.
-   Vendor profiles and relationships.
-   Questionnaire answers.
-   Evidence documents and extracted text.
-   Control assessments and risk scores.
-   Findings, remediation plans, and risk acceptances.
-   Reports and audit events.
-   Authentication tokens, signing keys, database credentials, and
    storage credentials.

## 3. Threat actors

-   Malicious external user or vendor respondent.
-   Compromised vendor account.
-   Malicious insider or over-privileged employee.
-   Opportunistic internet attacker.
-   Attacker exploiting a vulnerable dependency or document parser.
-   Attacker attempting to manipulate AI-assisted evidence analysis.

## 4. Threat scenarios and mitigations

  -----------------------------------------------------------------------
  Threat                  Impact                  Required controls
  ----------------------- ----------------------- -----------------------
  BOLA/IDOR               Cross-vendor or         Object-level
                          cross-tenant data       authorization, tenant
                          access                  scoping, negative tests

  SQL injection           Data theft or           Parameterized queries,
                          modification            safe ORM use,
                                                  least-privilege DB
                                                  account

  Stored/reflected XSS    Session abuse or        Output encoding, safe
                          malicious actions       rendering, CSP

  CSRF                    Unauthorized state      SameSite cookies, CSRF
                          changes                 tokens where cookie
                                                  auth is used

  SSRF                    Access to internal      Avoid arbitrary URL
                          services                fetches, egress
                                                  restrictions,
                                                  allowlists

  Malicious upload        Parser or host          Quarantine, signature
                          compromise              checks, AV scan,
                                                  sandboxed parsing

  Archive bomb            Resource exhaustion     Decompression limits,
                                                  file/page/time quotas

  Prompt injection        Misleading AI output    Treat documents as
                                                  data, constrained
                                                  prompts, schema
                                                  validation, human
                                                  review

  Credential theft        Account takeover        MFA, short sessions,
                                                  rotation, revocation,
                                                  secure secret storage

  Privilege escalation    Unauthorized            Least privilege,
                          approvals/admin actions separation of duties,
                                                  approval policy

  Queue poisoning         Unauthorized or         Authenticated broker,
                          repeated jobs           signed/validated task
                                                  references, idempotency

  DoS                     Service disruption      Rate limits, quotas,
                                                  timeouts, bounded
                                                  queues, capacity
                                                  monitoring

  Backup compromise       Bulk data exposure      Encryption, separate
                                                  credentials,
                                                  immutable/offline
                                                  copies, restore tests

  Audit tampering         Loss of accountability  Append-only export,
                                                  restricted write
                                                  access, integrity
                                                  verification
  -----------------------------------------------------------------------

## 5. Abuse cases to test

-   Change a vendor UUID in every API route and download URL.
-   Submit an assessment ID belonging to another tenant.
-   Reuse a vendor invitation after expiry or revocation.
-   Upload a file whose extension disagrees with its signature.
-   Upload oversized files and nested archives.
-   Submit HTML/script content in questionnaire answers and filenames.
-   Attempt SSRF through any URL import or webhook feature.
-   Place instruction-like content inside evidence documents.
-   Replay report-generation and remediation requests.
-   Attempt approval using a role that can review but cannot approve.

## 6. Risk treatment

For each threat, record likelihood, impact, owner, mitigation, test
evidence, and residual risk. Revisit the threat model when adding
integrations, AI, external URL fetching, new file formats, or new
tenant-facing features.

## 7. Security limitations

Controls reduce risk; they do not prove that the platform is
attack-proof. Production readiness requires independent review,
penetration testing, vulnerability remediation, monitoring, and incident
response exercises.
