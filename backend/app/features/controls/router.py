import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import (
    User,
    Framework,
    SecurityControl,
    ControlFrameworkMapping,
    ControlAssessmentResult,
    ControlEvidenceAssociation,
    ControlEffectiveness,
    Assessment,
    Evidence,
)
from app.core.schemas import (
    FrameworkResponse,
    SecurityControlResponse,
    SecurityControlCreate,
    ControlMappingBase,
    ControlAssessmentEvaluateRequest,
    ControlAssessmentResultResponse,
    FrameworkCoverageMetric,
)
from app.core.dependencies import require_permission

router = APIRouter(prefix="/controls", tags=["Security Controls & Frameworks"])


@router.get("/frameworks", response_model=List[FrameworkResponse])
def list_frameworks(
    current_user: User = Depends(require_permission("control:read")),
    db: Session = Depends(get_db),
):
    """List supported security compliance frameworks (NIST CSF 2.0, ISO 27001, SOC 2 TSC)"""
    return db.query(Framework).order_by(Framework.name).all()


@router.get("", response_model=List[SecurityControlResponse])
def list_security_controls(
    domain: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("control:read")),
    db: Session = Depends(get_db),
):
    """List versioned security controls catalog with all framework crosswalk mappings"""
    query = db.query(SecurityControl)
    if domain:
        query = query.filter(SecurityControl.domain == domain)

    controls = query.order_by(SecurityControl.code).all()
    results = []
    for c in controls:
        ctrl_dict = {
            "id": c.id,
            "code": c.code,
            "domain": c.domain.value if hasattr(c.domain, "value") else str(c.domain),
            "title": c.title,
            "description": c.description,
            "guidance": c.guidance,
            "version": c.version,
            "created_at": c.created_at,
            "mappings": [
                {
                    "id": m.id,
                    "control_id": m.control_id,
                    "framework_id": m.framework_id,
                    "framework_ref": m.framework_ref,
                    "mapping_notes": m.mapping_notes,
                    "framework_name": m.framework.name if m.framework else None,
                    "framework_version": m.framework.version if m.framework else None,
                }
                for m in c.mappings
            ]
        }
        results.append(ctrl_dict)
    return results


@router.get("/{control_id}", response_model=SecurityControlResponse)
def get_security_control(
    control_id: str,
    current_user: User = Depends(require_permission("control:read")),
    db: Session = Depends(get_db),
):
    """Get security control details by ID"""
    c = db.query(SecurityControl).filter(SecurityControl.id == control_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Security control not found")

    return {
        "id": c.id,
        "code": c.code,
        "domain": c.domain.value if hasattr(c.domain, "value") else str(c.domain),
        "title": c.title,
        "description": c.description,
        "guidance": c.guidance,
        "version": c.version,
        "created_at": c.created_at,
        "mappings": [
            {
                "id": m.id,
                "control_id": m.control_id,
                "framework_id": m.framework_id,
                "framework_ref": m.framework_ref,
                "mapping_notes": m.mapping_notes,
                "framework_name": m.framework.name if m.framework else None,
                "framework_version": m.framework.version if m.framework else None,
            }
            for m in c.mappings
        ]
    }


# ================= CONTROL EVALUATION WORKSPACE =================

@router.get("/assessments/{assessment_id}/results", response_model=List[ControlAssessmentResultResponse])
def get_assessment_control_results(
    assessment_id: str,
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    Get all security control evaluations for a given assessment,
    including linked evidence IDs and control details.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in organization")

    results = db.query(ControlAssessmentResult).filter(
        ControlAssessmentResult.assessment_id == assessment_id,
        ControlAssessmentResult.organization_id == current_user.organization_id,
    ).all()

    output = []
    for r in results:
        ev_ids = [assoc.evidence_id for assoc in r.evidence_associations]
        output.append({
            "id": r.id,
            "assessment_id": r.assessment_id,
            "control_id": r.control_id,
            "control_code": r.control.code if r.control else "N/A",
            "control_title": r.control.title if r.control else "N/A",
            "control_domain": r.control.domain.value if r.control and hasattr(r.control.domain, "value") else "N/A",
            "effectiveness": r.effectiveness.value if hasattr(r.effectiveness, "value") else str(r.effectiveness),
            "rationale": r.rationale,
            "evaluator_email": r.evaluator_email,
            "reviewed_at": r.reviewed_at,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "associated_evidence_ids": ev_ids,
        })
    return output


@router.post("/assessments/{assessment_id}/evaluate/{control_id}", response_model=ControlAssessmentResultResponse)
def evaluate_control_for_assessment(
    assessment_id: str,
    control_id: str,
    payload: ControlAssessmentEvaluateRequest,
    current_user: User = Depends(require_permission("assessment:evaluate")),
    db: Session = Depends(get_db),
):
    """
    Record analyst evaluation of a security control effectiveness for an assessment:
    - Sets effectiveness (effective, partially_effective, ineffective, not_applicable).
    - Records rationale & evaluator timestamp.
    - Associates verified evidence IDs to substantiate the finding.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in organization")

    control = db.query(SecurityControl).filter(SecurityControl.id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Security control not found")

    try:
        eff_enum = ControlEffectiveness(payload.effectiveness.lower().strip())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid effectiveness value '{payload.effectiveness}'. Must be effective, partially_effective, ineffective, or not_applicable."
        )

    # Find existing or create new result
    result = db.query(ControlAssessmentResult).filter(
        ControlAssessmentResult.assessment_id == assessment_id,
        ControlAssessmentResult.control_id == control_id,
    ).first()

    if not result:
        result = ControlAssessmentResult(
            id=str(uuid.uuid4()),
            organization_id=current_user.organization_id,
            assessment_id=assessment_id,
            control_id=control_id,
        )
        db.add(result)
        db.flush()

    result.effectiveness = eff_enum
    result.rationale = payload.rationale
    result.evaluator_email = current_user.email
    result.reviewed_at = datetime.now(timezone.utc)

    # Manage evidence associations
    if payload.evidence_ids is not None:
        # Clear existing associations
        db.query(ControlEvidenceAssociation).filter(
            ControlEvidenceAssociation.control_result_id == result.id
        ).delete()

        for ev_id in payload.evidence_ids:
            # Verify evidence belongs to same organization
            ev = db.query(Evidence).filter(
                Evidence.id == ev_id,
                Evidence.organization_id == current_user.organization_id,
            ).first()
            if ev:
                assoc = ControlEvidenceAssociation(
                    id=str(uuid.uuid4()),
                    control_result_id=result.id,
                    evidence_id=ev.id,
                )
                db.add(assoc)

    db.commit()
    db.refresh(result)

    ev_ids = [assoc.evidence_id for assoc in result.evidence_associations]
    return {
        "id": result.id,
        "assessment_id": result.assessment_id,
        "control_id": result.control_id,
        "control_code": control.code,
        "control_title": control.title,
        "control_domain": control.domain.value if hasattr(control.domain, "value") else str(control.domain),
        "effectiveness": result.effectiveness.value,
        "rationale": result.rationale,
        "evaluator_email": result.evaluator_email,
        "reviewed_at": result.reviewed_at,
        "created_at": result.created_at,
        "updated_at": result.updated_at,
        "associated_evidence_ids": ev_ids,
    }


@router.get("/assessments/{assessment_id}/coverage", response_model=List[FrameworkCoverageMetric])
def get_framework_coverage_metrics(
    assessment_id: str,
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    Computes real-time coverage metrics across NIST CSF 2.0, ISO 27001, and SOC 2
    based on evaluated control effectiveness.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in organization")

    # Fetch assessment evaluated results map
    results = db.query(ControlAssessmentResult).filter(
        ControlAssessmentResult.assessment_id == assessment_id,
    ).all()
    result_map = {r.control_id: r.effectiveness for r in results}

    frameworks = db.query(Framework).all()
    coverage_list = []

    for fw in frameworks:
        # Unique controls mapped to this framework
        ctrl_ids = list(set([m.control_id for m in fw.mappings]))
        total_ctrls = len(ctrl_ids)
        if total_ctrls == 0:
            continue

        eval_count = 0
        eff_count = 0
        part_count = 0
        ineff_count = 0

        for cid in ctrl_ids:
            if cid in result_map:
                eff = result_map[cid]
                if eff != ControlEffectiveness.UNASSESSED:
                    eval_count += 1
                if eff == ControlEffectiveness.EFFECTIVE:
                    eff_count += 1
                elif eff == ControlEffectiveness.PARTIALLY_EFFECTIVE:
                    part_count += 1
                elif eff == ControlEffectiveness.INEFFECTIVE:
                    ineff_count += 1

        coverage_pct = int((eval_count / total_ctrls) * 100) if total_ctrls > 0 else 0

        coverage_list.append(FrameworkCoverageMetric(
            framework_name=fw.name,
            framework_version=fw.version,
            total_controls=total_ctrls,
            evaluated_controls=eval_count,
            effective_controls=eff_count,
            partially_effective_controls=part_count,
            ineffective_controls=ineff_count,
            coverage_percentage=coverage_pct,
        ))

    return coverage_list

