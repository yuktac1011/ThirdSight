import uuid
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import (
    User,
    Evidence,
    SecurityControl,
    ControlAssessmentResult,
    ControlEvidenceAssociation,
    AIEvidenceInsight,
    AIInsightDecision,
    QuestionAnswer,
)
from app.core.schemas import (
    AIEvidenceInsightResponse,
    AIInsightReviewRequest,
)
from app.core.dependencies import require_permission
from app.features.ai.provider import ai_provider

router = APIRouter(prefix="/ai", tags=["AI Evidence Intelligence"])


@router.post("/evidence/{evidence_id}/analyze", response_model=AIEvidenceInsightResponse)
def analyze_evidence_document(
    evidence_id: str,
    current_user: User = Depends(require_permission("ai:analyze")),
    db: Session = Depends(get_db),
):
    """
    Executes AI evidence intelligence on an uploaded artifact:
    - Extracts key assertions and generates structured document summary.
    - Suggests control mappings with excerpt citations & page references.
    - Compares vendor questionnaire claims against extracted evidence facts.
    - Sanitizes adversarial prompt injection tokens.
    """
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.organization_id == current_user.organization_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found in organization")

    text_to_analyze = evidence.extracted_text_preview or evidence.file_name

    # Fetch available controls
    controls = db.query(SecurityControl).all()
    ctrl_list = [{"code": c.code, "title": c.title} for c in controls]

    # Fetch vendor answers if linked to assessment
    claims = []
    if evidence.assessment_id:
        answers = db.query(QuestionAnswer).filter(QuestionAnswer.assessment_id == evidence.assessment_id).all()
        for a in answers:
            q_text = a.question.text if a.question else ""
            claims.append({
                "question_text": q_text,
                "response_value": a.response_value,
                "justification": a.justification or "",
            })

    # Run AI extraction
    ai_result = ai_provider.analyze_document(text_to_analyze, ctrl_list, claims)

    # Persist or update insight
    insight = db.query(AIEvidenceInsight).filter(AIEvidenceInsight.evidence_id == evidence.id).first()
    if not insight:
        insight = AIEvidenceInsight(
            id=str(uuid.uuid4()),
            evidence_id=evidence.id,
            organization_id=current_user.organization_id,
        )
        db.add(insight)

    insight.summary = ai_result.summary
    insight.confidence_score = ai_result.confidence_score
    insight.suggested_mappings_json = json.dumps(ai_result.suggested_mappings)
    insight.claims_comparison_json = json.dumps(ai_result.discrepancies)
    insight.prompt_sanitization_log = ai_result.sanitization_log
    insight.decision = AIInsightDecision.PENDING
    insight.created_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(insight)

    return {
        "id": insight.id,
        "evidence_id": insight.evidence_id,
        "summary": insight.summary,
        "confidence_score": insight.confidence_score,
        "suggested_mappings": json.loads(insight.suggested_mappings_json),
        "discrepancies": json.loads(insight.claims_comparison_json) if insight.claims_comparison_json else [],
        "decision": insight.decision.value,
        "reviewed_by": insight.reviewed_by,
        "reviewed_at": insight.reviewed_at,
        "created_at": insight.created_at,
    }


@router.get("/evidence/{evidence_id}/insights", response_model=Optional[AIEvidenceInsightResponse])
def get_evidence_insights(
    evidence_id: str,
    current_user: User = Depends(require_permission("ai:read")),
    db: Session = Depends(get_db),
):
    """Retrieve existing AI analysis insights for an evidence file"""
    insight = db.query(AIEvidenceInsight).filter(
        AIEvidenceInsight.evidence_id == evidence_id,
        AIEvidenceInsight.organization_id == current_user.organization_id,
    ).first()
    if not insight:
        return None

    return {
        "id": insight.id,
        "evidence_id": insight.evidence_id,
        "summary": insight.summary,
        "confidence_score": insight.confidence_score,
        "suggested_mappings": json.loads(insight.suggested_mappings_json),
        "discrepancies": json.loads(insight.claims_comparison_json) if insight.claims_comparison_json else [],
        "decision": insight.decision.value,
        "reviewed_by": insight.reviewed_by,
        "reviewed_at": insight.reviewed_at,
        "created_at": insight.created_at,
    }


@router.post("/evidence/{evidence_id}/insights/{insight_id}/decision", response_model=AIEvidenceInsightResponse)
def review_ai_insight_decision(
    evidence_id: str,
    insight_id: str,
    payload: AIInsightReviewRequest,
    current_user: User = Depends(require_permission("ai:review")),
    db: Session = Depends(get_db),
):
    """
    Strict Human-in-the-Loop Analyst Verification:
    - Analyst approves or rejects AI suggested control mappings.
    - If approved with selected control codes, automatically creates ControlEvidenceAssociation
      linking the evidence to the assessment's control results.
    - AI is forbidden from auto-approving or modifying access without this human sign-off.
    """
    insight = db.query(AIEvidenceInsight).filter(
        AIEvidenceInsight.id == insight_id,
        AIEvidenceInsight.evidence_id == evidence_id,
        AIEvidenceInsight.organization_id == current_user.organization_id,
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="AI insight record not found")

    decision = payload.decision.lower().strip()
    if decision == "approve":
        insight.decision = AIInsightDecision.APPROVED
        evidence = insight.evidence

        # If assessment is linked, associate approved controls
        if evidence.assessment_id and payload.selected_control_codes:
            for code in payload.selected_control_codes:
                ctrl = db.query(SecurityControl).filter(SecurityControl.code == code).first()
                if ctrl:
                    # Find or create control result for this assessment
                    ctrl_result = db.query(ControlAssessmentResult).filter(
                        ControlAssessmentResult.assessment_id == evidence.assessment_id,
                        ControlAssessmentResult.control_id == ctrl.id,
                    ).first()
                    if not ctrl_result:
                        ctrl_result = ControlAssessmentResult(
                            id=str(uuid.uuid4()),
                            organization_id=current_user.organization_id,
                            assessment_id=evidence.assessment_id,
                            control_id=ctrl.id,
                        )
                        db.add(ctrl_result)
                        db.flush()

                    # Check association
                    existing_assoc = db.query(ControlEvidenceAssociation).filter(
                        ControlEvidenceAssociation.control_result_id == ctrl_result.id,
                        ControlEvidenceAssociation.evidence_id == evidence.id,
                    ).first()
                    if not existing_assoc:
                        assoc = ControlEvidenceAssociation(
                            id=str(uuid.uuid4()),
                            control_result_id=ctrl_result.id,
                            evidence_id=evidence.id,
                            notes="Associated via approved AI evidence intelligence suggestion",
                        )
                        db.add(assoc)
    elif decision == "reject":
        insight.decision = AIInsightDecision.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid decision. Use 'approve' or 'reject'.")

    insight.reviewed_by = current_user.email
    insight.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(insight)

    return {
        "id": insight.id,
        "evidence_id": insight.evidence_id,
        "summary": insight.summary,
        "confidence_score": insight.confidence_score,
        "suggested_mappings": json.loads(insight.suggested_mappings_json),
        "discrepancies": json.loads(insight.claims_comparison_json) if insight.claims_comparison_json else [],
        "decision": insight.decision.value,
        "reviewed_by": insight.reviewed_by,
        "reviewed_at": insight.reviewed_at,
        "created_at": insight.created_at,
    }

