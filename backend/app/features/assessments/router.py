import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.models import (
    Assessment,
    AssessmentHistory,
    AssessmentStatus,
    Vendor,
    QuestionnaireTemplate,
    Question,
    QuestionAnswer,
    User,
)
from app.core.dependencies import get_current_user_and_tenant, require_permission
from app.core.schemas import (
    AssessmentCreate,
    AssessmentReviewAction,
    AssessmentResponse,
    AnswerSubmission,
    AnswerResponse,
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def calculate_assessment_score(assessment: Assessment, db: Session) -> float:
    """Deterministic score calculation (0 - 100) based on weighted control responses"""
    questions = assessment.template.questions
    if not questions:
        return 100.0

    total_weight = sum(q.weight for q in questions)
    if total_weight <= 0:
        return 100.0

    answers = {a.question_id: a for a in assessment.answers}
    accumulated_points = 0.0

    for q in questions:
        ans = answers.get(q.id)
        if not ans:
            continue

        resp = ans.response_value.lower().strip()
        if resp == "yes":
            accumulated_points += q.weight * 1.0
        elif resp == "partial":
            accumulated_points += q.weight * 0.5
        elif resp in ["na", "n/a"]:
            # N/A exempts question from denominator penalty
            total_weight -= q.weight
        elif resp == "no":
            accumulated_points += 0.0
        else:
            # Text/generic
            accumulated_points += q.weight * 0.8

    if total_weight <= 0:
        return 100.0

    final_score = (accumulated_points / total_weight) * 100.0
    return round(final_score, 1)


@router.get("", response_model=List[AssessmentResponse])
def list_assessments(
    vendor_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    List all vendor security assessments within tenant boundary.
    """
    query = db.query(Assessment).filter(Assessment.organization_id == current_user.organization_id)

    if vendor_id:
        query = query.filter(Assessment.vendor_id == vendor_id)

    if status_filter:
        try:
            status_enum = AssessmentStatus(status_filter)
            query = query.filter(Assessment.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid assessment status filter")

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.join(Vendor).join(QuestionnaireTemplate).filter(
            or_(
                Assessment.scope.ilike(search_fmt),
                Vendor.name.ilike(search_fmt),
                QuestionnaireTemplate.title.ilike(search_fmt),
            )
        )

    assessments = query.order_by(Assessment.created_at.desc()).all()
    results = []
    for a in assessments:
        item = AssessmentResponse.model_validate(a)
        item.vendor_name = a.vendor.name if a.vendor else "Unknown Vendor"
        item.template_title = f"{a.template.title} (v{a.template.version})" if a.template else "Template"
        total_q = len(a.template.questions) if a.template else 0
        ans_q = len(a.answers)
        item.completion_percentage = int((ans_q / total_q) * 100) if total_q > 0 else 0
        results.append(item)
    return results


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Initiate a new vendor assessment linked to a versioned questionnaire template.
    Verifies tenant ownership of both vendor and questionnaire template.
    """
    # 1. Verify vendor
    vendor = db.query(Vendor).filter(
        Vendor.id == payload.vendor_id,
        Vendor.organization_id == current_user.organization_id,
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    # 2. Verify template
    template = db.query(QuestionnaireTemplate).filter(
        QuestionnaireTemplate.id == payload.template_id,
        QuestionnaireTemplate.organization_id == current_user.organization_id,
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Questionnaire template not found")

    assigned_email = payload.assigned_respondent_email
    if not assigned_email and vendor.contacts:
        assigned_email = vendor.contacts[0].email

    assessment_id = str(uuid.uuid4())
    assessment = Assessment(
        id=assessment_id,
        organization_id=current_user.organization_id,
        vendor_id=vendor.id,
        template_id=template.id,
        version=1,
        status=AssessmentStatus.ASSIGNED if assigned_email else AssessmentStatus.INITIATED,
        scope=payload.scope.strip(),
        due_at=payload.due_at,
        assigned_respondent_email=assigned_email,
        is_locked=False,
    )
    db.add(assessment)
    db.flush()

    # Record history
    history_entry = AssessmentHistory(
        id=str(uuid.uuid4()),
        assessment_id=assessment.id,
        from_status=None,
        to_status=assessment.status.value,
        actor_email=current_user.email,
        comment=f"Assessment initiated with {template.title} (v{template.version})",
    )
    db.add(history_entry)
    db.commit()
    db.refresh(assessment)

    item = AssessmentResponse.model_validate(assessment)
    item.vendor_name = vendor.name
    item.template_title = f"{template.title} (v{template.version})"
    item.completion_percentage = 0
    return item


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    Read complete assessment dossier with questions, answers, and audit history.
    Enforces strict IDOR protection.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in organization")

    item = AssessmentResponse.model_validate(assessment)
    item.vendor_name = assessment.vendor.name if assessment.vendor else "Unknown Vendor"
    item.template_title = f"{assessment.template.title} (v{assessment.template.version})" if assessment.template else "Template"
    total_q = len(assessment.template.questions) if assessment.template else 0
    ans_q = len(assessment.answers)
    item.completion_percentage = int((ans_q / total_q) * 100) if total_q > 0 else 0
    return item


@router.post("/{assessment_id}/answers", response_model=AnswerResponse)
def submit_or_draft_answer(
    assessment_id: str,
    payload: AnswerSubmission,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Save draft or recorded response for a question inside the assessment.
    Guarantees locked submissions cannot be altered without reopening.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment responses are locked. An analyst must reopen the assessment to modify answers.",
        )

    # Validate question belongs to assessment template
    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.template_id == assessment.template_id,
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question is not part of assigned assessment")

    # Business rule: N/A and Partial require non-empty justification
    normalized_val = payload.response_value.lower().strip()
    if normalized_val in ["na", "n/a", "partial"]:
        if not payload.justification or len(payload.justification.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A detailed explanation (minimum 5 chars) is mandatory when responding '{payload.response_value}'",
            )

    existing = db.query(QuestionAnswer).filter(
        QuestionAnswer.assessment_id == assessment.id,
        QuestionAnswer.question_id == question.id,
    ).first()

    if existing:
        existing.response_value = payload.response_value
        existing.justification = payload.justification
        existing.evidence_reference = payload.evidence_reference
        db.commit()
        db.refresh(existing)
        answer = existing
    else:
        answer = QuestionAnswer(
            id=str(uuid.uuid4()),
            assessment_id=assessment.id,
            question_id=question.id,
            response_value=payload.response_value,
            justification=payload.justification,
            evidence_reference=payload.evidence_reference,
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)

    # Transition from INITIATED/ASSIGNED to IN_PROGRESS
    if assessment.status in [AssessmentStatus.INITIATED, AssessmentStatus.ASSIGNED]:
        old_status = assessment.status.value
        assessment.status = AssessmentStatus.IN_PROGRESS
        history_entry = AssessmentHistory(
            id=str(uuid.uuid4()),
            assessment_id=assessment.id,
            from_status=old_status,
            to_status=assessment.status.value,
            actor_email=current_user.email,
            comment="First answer saved; assessment marked in progress",
        )
        db.add(history_entry)
        db.commit()

    return answer


@router.post("/{assessment_id}/submit", response_model=AssessmentResponse)
def submit_assessment_for_review(
    assessment_id: str,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Submits completed assessment for SecOps analyst review.
    Enforces that all mandatory questions are answered, computes posture score, and locks answers.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment.is_locked and assessment.status == AssessmentStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Assessment is already submitted and locked")

    # Check that all mandatory questions are answered
    mandatory_questions = [q for q in assessment.template.questions if q.is_mandatory]
    answered_ids = {a.question_id for a in assessment.answers}

    missing_mandatory = [q for q in mandatory_questions if q.id not in answered_ids]
    if missing_mandatory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit: {len(missing_mandatory)} mandatory questions have not been answered.",
        )

    old_status = assessment.status.value
    assessment.status = AssessmentStatus.SUBMITTED
    assessment.is_locked = True
    assessment.score = calculate_assessment_score(assessment, db)

    history_entry = AssessmentHistory(
        id=str(uuid.uuid4()),
        assessment_id=assessment.id,
        from_status=old_status,
        to_status=assessment.status.value,
        actor_email=current_user.email,
        comment=f"Assessment submitted for formal review. Computed score: {assessment.score}/100",
    )
    db.add(history_entry)
    db.commit()
    db.refresh(assessment)

    item = AssessmentResponse.model_validate(assessment)
    item.vendor_name = assessment.vendor.name
    item.template_title = f"{assessment.template.title} (v{assessment.template.version})"
    item.completion_percentage = 100
    return item


@router.post("/{assessment_id}/review", response_model=AssessmentResponse)
def review_assessment(
    assessment_id: str,
    payload: AssessmentReviewAction,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Analyst review workflow: approve, reject, or reopen an assessment.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.organization_id == current_user.organization_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    action = payload.action.lower().strip()
    old_status = assessment.status.value

    if action == "approve":
        assessment.status = AssessmentStatus.APPROVED
        assessment.is_locked = True
        assessment.analyst_reviewer_id = current_user.id
        assessment.review_notes = payload.review_notes
        assessment.reviewed_at = datetime.now(timezone.utc)
        # Update vendor's overall risk posture with approved score
        if assessment.score is not None:
            assessment.vendor.risk_score = int(assessment.score)
    elif action == "reject":
        assessment.status = AssessmentStatus.REJECTED
        assessment.is_locked = True
        assessment.analyst_reviewer_id = current_user.id
        assessment.review_notes = payload.review_notes
        assessment.reviewed_at = datetime.now(timezone.utc)
    elif action == "reopen":
        assessment.status = AssessmentStatus.REOPENED
        assessment.is_locked = False
        assessment.review_notes = payload.review_notes or "Reopened for additional evidence or clarifications"
    else:
        raise HTTPException(status_code=400, detail="Invalid review action. Allowed: approve, reject, reopen")

    history_entry = AssessmentHistory(
        id=str(uuid.uuid4()),
        assessment_id=assessment.id,
        from_status=old_status,
        to_status=assessment.status.value,
        actor_email=current_user.email,
        comment=payload.review_notes or f"Assessment {action}ed by analyst",
    )
    db.add(history_entry)
    db.commit()
    db.refresh(assessment)

    item = AssessmentResponse.model_validate(assessment)
    item.vendor_name = assessment.vendor.name
    item.template_title = f"{assessment.template.title} (v{assessment.template.version})"
    total_q = len(assessment.template.questions) if assessment.template else 0
    ans_q = len(assessment.answers)
    item.completion_percentage = int((ans_q / total_q) * 100) if total_q > 0 else 0
    return item

