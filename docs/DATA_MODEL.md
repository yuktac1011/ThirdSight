# Data Model

## 1. Design principles

-   Use UUID primary keys where appropriate.
-   Store timestamps in UTC.
-   Use foreign keys, unique constraints, check constraints, and
    indexes.
-   Add `organization_id` to tenant-owned records.
-   Use explicit lifecycle states rather than ambiguous booleans.
-   Version questionnaires, control libraries, methodologies, and
    assessments.
-   Preserve historical snapshots used by approved reports.

## 2. Core entities

  ---------------------------------------------------------------------------
  Entity                  Key fields                  Purpose
  ----------------------- --------------------------- -----------------------
  Organization            id, name, status            Tenant boundary

  User                    id, organization_id,        Organization user
                          identity_subject, status    

  Role / Permission       role_id, permission_code    Access policy

  Vendor                  id, organization_id, name,  Third party
                          criticality, status         

  VendorContact           id, vendor_id,              Vendor respondents
                          identity/email, status      

  Assessment              id, vendor_id, version,     Assessment instance
                          status, methodology_version 

  QuestionnaireTemplate   id, version, status         Reusable questionnaire

  Question                id, template_id, domain,    Question definition
                          type, weight                

  Answer                  id, assessment_id,          Vendor response
                          question_id, value,         
                          justification               

  Evidence                id, answer_id/control_id,   Supporting artifact
                          object_key, hash, status    

  Control                 id, code, version, domain,  Control library
                          description                 

  Framework               id, name, version           Framework catalog

  ControlMapping          control_id, framework_id,   Crosswalk
                          reference                   

  ControlResult           id, assessment_id,          Evaluation
                          control_id, effectiveness,  
                          rationale                   

  Finding                 id, assessment_id,          Identified gap
                          control_result_id,          
                          severity, status            

  Remediation             id, finding_id, owner,      Corrective action
                          due_date, status            

  RiskScore               id, assessment_id,          Risk result
                          score_type, value,          
                          model_version               

  RiskAcceptance          id,                         Formal acceptance
                          finding_id/assessment_id,   
                          approver, rationale, expiry 

  Report                  id, assessment_id, version, Generated output
                          object_key, hash            

  AuditEvent              id, organization_id, actor, Audit history
                          action, target, timestamp   

  OutboxEvent             id, aggregate_id,           Reliable async dispatch
                          event_type, payload,        
                          published_at                
  ---------------------------------------------------------------------------

## 3. Important constraints

-   Vendor names need not be globally unique; scope uniqueness to a
    tenant only if business rules require it.
-   A question answer must reference a question version applicable to
    that assessment.
-   Evidence must retain its original hash and processing status.
-   A report must point to the exact assessment and methodology versions
    used.
-   Risk acceptance must include approver, rationale, scope, and expiry.
-   Prevent duplicate active assignments and duplicate idempotency keys.
-   Enforce valid state transitions in application services and, where
    practical, database constraints.

## 4. Tenant isolation

Every tenant-scoped query must use the authenticated tenant context.
Never accept `organization_id` as authoritative from an untrusted
client. For high-assurance deployments, add PostgreSQL RLS and test it
using the actual application database role.

## 5. Data lifecycle

Define retention separately for vendor profiles, evidence, reports,
audit events, and backups. Deletion must account for legal holds,
references, object versions, and backup expiration. Avoid cascading
deletion of audit history.
