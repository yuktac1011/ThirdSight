import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import (
    User,
    Assessment,
    Vendor,
    ControlAssessmentResult,
    ControlEffectiveness,
    RiskScore,
    Finding,
    FindingSeverity,
    FindingStatus,
    Remediation,
    RemediationStatus,
    RiskAcceptance,
)
from app.core.schemas import (
    RiskScoreResponse,
    FindingResponse,
    RemediationCreate,
    RemediationUpdate,
    RemediationResponse,
    RiskAcceptanceRequest,
    RiskAcceptanceResponse,
)
from app.core.dependencies import require_permission
from app.features.risk.engine import (
    METHODOLOGY_VERSION,
    calculate_inherent_dimensions,
    calculate_control_effectiveness,
    calculate_residual_risk,
)

router = APIRouter(prefix="/risk", tags=["Risk Engine & Remediation"])


@router.post("/assessments/{assessment_id}/calculate", response_model=RiskScoreResponse)
def calculate_assessment_risk(
    assessment_id: str,
    current_user: User = Depends(require_permission("risk:calculate")),
    db: Session = Depends(get_db),
):
    """
    Deterministic risk calculation engine:
    1. Derives Inherent Risk (Likelihood x Impact) based on vendor criticality, data classification, access level.
    2. Calculates Control Effectiveness Score from validated controls.
    3. Calculates Residual Risk and assigns 5x5 heatmap risk bands.
    4. Automatically generates Security Findings for Ineffective and Partially Effective controls.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in organization")

    vendor = assessment.vendor
    if not vendor:
        raise HTTPException(status_code=400, detail="Assessment has no associated vendor")

    # 1. Inherent Risk
    likelihood, impact, inherent_score, inherent_band = calculate_inherent_dimensions(
        criticality=vendor.criticality,
        data_classification=vendor.data_classification,
        access_level=vendor.access_level,
    )

    # 2. Control Effectiveness
    control_results = db.query(ControlAssessmentResult).filter(
        ControlAssessmentResult.assessment_id == assessment_id,
    ).all()
    evaluations = [r.effectiveness for r in control_results]
    effectiveness_score = calculate_control_effectiveness(evaluations)

    # 3. Residual Risk
    residual_score, residual_band = calculate_residual_risk(inherent_score, effectiveness_score)

    explanation = (
        f"Inherent Risk {inherent_score} ({inherent_band.value.upper()}) derived from "
        f"{vendor.criticality.value} criticality (Likelihood={likelihood}) and "
        f"{vendor.data_classification.value} data classification (Impact={impact}). "
        f"Validated control posture achieves {int(effectiveness_score * 100)}% effectiveness across "
        f"{len(evaluations)} controls, reducing residual exposure to {residual_score} ({residual_band.value.upper()})."
    )

    # Store or update RiskScore
    risk_record = db.query(RiskScore).filter(RiskScore.assessment_id == assessment_id).first()
    if not risk_record:
        risk_record = RiskScore(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            organization_id=current_user.organization_id,
        )
        db.add(risk_record)

    risk_record.methodology_version = METHODOLOGY_VERSION
    risk_record.likelihood = likelihood
    risk_record.impact = impact
    risk_record.inherent_score = inherent_score
    risk_record.inherent_band = inherent_band
    risk_record.control_effectiveness_score = effectiveness_score
    risk_record.residual_score = residual_score
    risk_record.residual_band = residual_band
    risk_record.explanation = explanation
    risk_record.calculated_at = datetime.now(timezone.utc)

    # 4. Auto-generate Gap Findings for Ineffective and Partially Effective controls
    existing_finding_controls = {
        f.control_id for f in db.query(Finding).filter(Finding.assessment_id == assessment_id).all() if f.control_id
    }

    for cr in control_results:
        if cr.effectiveness in [ControlEffectiveness.INEFFECTIVE, ControlEffectiveness.PARTIALLY_EFFECTIVE]:
            if cr.control_id not in existing_finding_controls:
                ctrl = cr.control
                ctrl_code = ctrl.code if ctrl else "CTRL"
                ctrl_title = ctrl.title if ctrl else "Security Control"
                sev = FindingSeverity.HIGH if cr.effectiveness == ControlEffectiveness.INEFFECTIVE else FindingSeverity.MEDIUM

                finding = Finding(
                    id=str(uuid.uuid4()),
                    assessment_id=assessment.id,
                    organization_id=current_user.organization_id,
                    control_id=cr.control_id,
                    title=f"Control Gap: {ctrl_code} - {ctrl_title}",
                    description=cr.rationale or f"Control {ctrl_code} evaluated as {cr.effectiveness.value}. Remediation or compensating controls required.",
                    severity=sev,
                    status=FindingStatus.OPEN,
                )
                db.add(finding)

    db.commit()
    db.refresh(risk_record)
    return risk_record


@router.get("/assessments/{assessment_id}", response_model=Optional[RiskScoreResponse])
def get_assessment_risk(
    assessment_id: str,
    current_user: User = Depends(require_permission("risk:read")),
    db: Session = Depends(get_db),
):
    """Retrieve existing calculated risk score and dimensions for assessment"""
    risk = db.query(RiskScore).filter(
        RiskScore.assessment_id == assessment_id,
        RiskScore.organization_id == current_user.organization_id,
    ).first()
    return risk


@router.get("/assessments/{assessment_id}/findings", response_model=List[FindingResponse])
def list_assessment_findings(
    assessment_id: str,
    current_user: User = Depends(require_permission("risk:read")),
    db: Session = Depends(get_db),
):
    """List all security gap findings, remediations, and risk acceptances for an assessment"""
    findings = db.query(Finding).filter(
        Finding.assessment_id == assessment_id,
        Finding.organization_id == current_user.organization_id,
    ).order_by(Finding.identified_at.desc()).all()

    output = []
    for f in findings:
        ctrl_code = f.control.code if f.control else None
        output.append({
            "id": f.id,
            "assessment_id": f.assessment_id,
            "organization_id": f.organization_id,
            "control_id": f.control_id,
            "control_code": ctrl_code,
            "title": f.title,
            "description": f.description,
            "severity": f.severity.value,
            "status": f.status.value,
            "identified_at": f.identified_at,
            "closed_at": f.closed_at,
            "remediations": [
                {
                    "id": rem.id,
                    "finding_id": rem.finding_id,
                    "title": rem.title,
                    "action_plan": rem.action_plan,
                    "owner_email": rem.owner_email,
                    "due_date": rem.due_date,
                    "status": rem.status.value,
                    "created_at": rem.created_at,
                    "updated_at": rem.updated_at,
                }
                for rem in f.remediations
            ],
            "risk_acceptance": {
                "id": f.risk_acceptance.id,
                "finding_id": f.risk_acceptance.finding_id,
                "approver_email": f.risk_acceptance.approver_email,
                "rationale": f.risk_acceptance.rationale,
                "compensating_controls": f.risk_acceptance.compensating_controls,
                "expires_at": f.risk_acceptance.expires_at,
                "created_at": f.risk_acceptance.created_at,
            } if f.risk_acceptance else None,
        })
    return output


@router.post("/findings/{finding_id}/remediations", response_model=RemediationResponse, status_code=status.HTTP_201_CREATED)
def create_remediation_task(
    finding_id: str,
    payload: RemediationCreate,
    current_user: User = Depends(require_permission("remediation:write")),
    db: Session = Depends(get_db),
):
    """Create a tracked corrective action item for a security finding"""
    finding = db.query(Finding).filter(
        Finding.id == finding_id,
        Finding.organization_id == current_user.organization_id,
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    remediation = Remediation(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        organization_id=current_user.organization_id,
        title=payload.title,
        action_plan=payload.action_plan,
        owner_email=payload.owner_email,
        due_date=payload.due_date,
        status=RemediationStatus.PLANNED,
    )
    db.add(remediation)
    if finding.status == FindingStatus.OPEN:
        finding.status = FindingStatus.IN_REMEDIATION

    db.commit()
    db.refresh(remediation)
    return remediation


@router.patch("/remediations/{remediation_id}", response_model=RemediationResponse)
def update_remediation_status(
    remediation_id: str,
    payload: RemediationUpdate,
    current_user: User = Depends(require_permission("remediation:write")),
    db: Session = Depends(get_db),
):
    """Update status and action plan of a remediation task"""
    remediation = db.query(Remediation).filter(
        Remediation.id == remediation_id,
        Remediation.organization_id == current_user.organization_id,
    ).first()
    if not remediation:
        raise HTTPException(status_code=404, detail="Remediation not found")

    try:
        rem_status = RemediationStatus(payload.status.lower().strip())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'")

    remediation.status = rem_status
    if payload.action_plan:
        remediation.action_plan = payload.action_plan

    # If completed, check if all remediations for finding are done
    if rem_status == RemediationStatus.COMPLETED:
        finding = remediation.finding
        all_completed = all(r.status == RemediationStatus.COMPLETED for r in finding.remediations)
        if all_completed:
            finding.status = FindingStatus.RESOLVED
            finding.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(remediation)
    return remediation


@router.post("/findings/{finding_id}/accept-risk", response_model=RiskAcceptanceResponse)
def accept_finding_risk(
    finding_id: str,
    payload: RiskAcceptanceRequest,
    current_user: User = Depends(require_permission("risk:accept")),
    db: Session = Depends(get_db),
):
    """
    Formal delegated risk acceptance:
    - Authorizes an explicit exception with business rationale and compensating controls.
    - Transitions finding status to ACCEPTED with a mandatory expiration timestamp.
    """
    finding = db.query(Finding).filter(
        Finding.id == finding_id,
        Finding.organization_id == current_user.organization_id,
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if payload.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Risk acceptance expiration date must be in the future")

    # Check existing or create acceptance
    acceptance = db.query(RiskAcceptance).filter(RiskAcceptance.finding_id == finding.id).first()
    if not acceptance:
        acceptance = RiskAcceptance(
            id=str(uuid.uuid4()),
            finding_id=finding.id,
            assessment_id=finding.assessment_id,
            organization_id=current_user.organization_id,
            approver_email=current_user.email,
            rationale=payload.rationale,
            compensating_controls=payload.compensating_controls,
            expires_at=payload.expires_at,
        )
        db.add(acceptance)
    else:
        acceptance.approver_email = current_user.email
        acceptance.rationale = payload.rationale
        acceptance.compensating_controls = payload.compensating_controls
        acceptance.expires_at = payload.expires_at

    finding.status = FindingStatus.ACCEPTED
    db.commit()
    db.refresh(acceptance)
    return acceptance

