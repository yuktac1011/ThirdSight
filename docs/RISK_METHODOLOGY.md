# Risk Assessment Methodology

## 1. Purpose

This document defines a transparent starting methodology. It must be
reviewed and approved by the organization before operational use. Scores
are decision-support outputs, not objective guarantees.

## 2. Separate inherent and residual risk

-   **Inherent risk:** exposure before considering the effectiveness of
    controls.
-   **Residual risk:** exposure remaining after considering validated
    control effectiveness and other mitigations.

Do not calculate residual risk solely from vendor questionnaire answers.

## 3. Risk dimensions

A practical initial model may consider:

-   Likelihood: 1--5.
-   Impact: 1--5.
-   Data sensitivity.
-   Service criticality.
-   Connectivity and access level.
-   Regulatory and contractual exposure.
-   Threat exposure.
-   Control design and operating effectiveness.
-   Evidence quality, scope, and freshness.

## 4. Basic risk calculation

For an individual scenario:

`Inherent Risk = Likelihood × Impact`

Illustrative bands:

     Score Illustrative label
  -------- --------------------
      1--4 Low
      5--9 Moderate
    10--15 High
    16--25 Critical

These thresholds are examples only. Calibrate them against the
organization's risk appetite and loss scenarios.

## 5. Residual risk

A simplified illustrative model is:

`Residual Risk = Inherent Risk × (1 - Validated Control Effectiveness)`

where validated control effectiveness is a value between 0 and 1.

Do not use this formula as a universal standard. A production
methodology should specify: - How likelihood and impact are assigned. -
How control effectiveness is tested. - How evidence confidence and age
affect confidence in a control. - How multiple controls combine. - How
risk scores are aggregated without hiding critical findings. - How
exceptions and N/A responses are treated. - How risk acceptance and
expiry work.

## 6. Evidence confidence

Suggested states:

-   Not provided.
-   Provided, not reviewed.
-   Relevant but incomplete.
-   Validated for stated scope and period.
-   Rejected or contradictory.
-   Expired.

Evidence presence is not proof of operating effectiveness. A policy may
demonstrate design intent but not actual implementation.

## 7. Findings and treatment

Every finding should include: - Unique ID and assessment version. -
Affected control and security domain. - Description and evidence
references. - Severity and rationale. - Business impact. - Recommended
action. - Owner and due date. - Status and verification evidence. -
Closure reviewer and timestamp.

## 8. Risk acceptance

Risk acceptance must be explicit, authorized, scoped, justified,
time-bound, and auditable. Expired acceptances should trigger
reassessment or escalation.

## 9. Reproducibility

Persist the methodology version, control library version, inputs,
calculation version, and result snapshot. Re-running an old assessment
must not silently use today's rules.
