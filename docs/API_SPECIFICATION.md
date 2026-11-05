# API Specification

## 1. Conventions

-   Prefix: `/api/v1`
-   Format: JSON unless uploading/downloading a file.
-   Authentication: OIDC-backed session or bearer-token design.
-   IDs: UUID.
-   Timestamps: ISO 8601 UTC.
-   Pagination: cursor-based for large collections.
-   Errors: consistent machine-readable error codes.
-   All tenant-owned operations require tenant and object-level
    authorization.

## 2. Initial endpoints

  -----------------------------------------------------------------------------------------
  Method                  Path                                      Purpose
  ----------------------- ----------------------------------------- -----------------------
  POST                    `/vendors`                                Create vendor

  GET                     `/vendors`                                List authorized vendors

  GET                     `/vendors/{vendor_id}`                    Read vendor

  PATCH                   `/vendors/{vendor_id}`                    Update vendor

  POST                    `/assessments`                            Create assessment

  GET                     `/assessments/{assessment_id}`            Read assessment

  POST                    `/assessments/{assessment_id}/assign`     Assign vendor
                                                                    respondents

  POST                    `/assessments/{assessment_id}/answers`    Submit answers

  POST                    `/assessments/{assessment_id}/evidence`   Initiate evidence
                                                                    upload

  GET                     `/evidence/{evidence_id}`                 Read evidence metadata

  POST                    `/evidence/{evidence_id}/review`          Review evidence

  GET                     `/assessments/{assessment_id}/controls`   List control results

  POST                    `/assessments/{assessment_id}/evaluate`   Run deterministic
                                                                    evaluation

  GET                     `/assessments/{assessment_id}/risks`      Read risk results

  GET                     `/assessments/{assessment_id}/findings`   List findings

  POST                    `/findings/{finding_id}/remediations`     Create remediation

  POST                    `/assessments/{assessment_id}/reports`    Request report
                                                                    generation

  GET                     `/reports/{report_id}`                    Read report
                                                                    metadata/download
                                                                    authorization
  -----------------------------------------------------------------------------------------

## 3. Example: create vendor

Request:

``` json
{
  "name": "Example Payment Services",
  "industry": "Financial technology",
  "service_description": "Payment processing",
  "data_classification": "confidential",
  "criticality": "high"
}
```

The server derives the organization from the authenticated principal. It
must ignore or reject any client-supplied tenant identifier.

## 4. Example: create assessment

``` json
{
  "vendor_id": "UUID",
  "questionnaire_template_version_id": "UUID",
  "scope": "Payment processing service",
  "due_at": "2026-12-01T12:00:00Z"
}
```

The API verifies that the vendor and template are accessible to the
caller and snapshots the applicable versions.

## 5. Error model

Example:

``` json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "request_id": "correlation-id"
  }
}
```

Use non-enumerating responses where appropriate so unauthorized users
cannot discover whether another tenant's object exists.

## 6. API security requirements

-   Validate every path, query, header, and body input.
-   Authorize the target object, not just the route.
-   Apply pagination limits and upload quotas.
-   Use idempotency for retryable state-changing operations.
-   Apply CSRF protections if browser authentication uses cookies.
-   Avoid logging authorization headers, tokens, document contents, or
    secrets.
-   Use explicit response schemas to prevent accidental data leakage.
-   Generate short-lived download access only after authorization.
-   Document rate limits and retry behavior.
