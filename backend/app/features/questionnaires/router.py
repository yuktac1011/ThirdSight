import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.models import (
    QuestionnaireTemplate,
    Question,
    QuestionnaireAssignment,
    QuestionAnswer,
    TemplateStatus,
    QuestionType,
    SecurityDomain,
    AssignmentStatus,
    Vendor,
    User,
)
from app.core.dependencies import get_current_user_and_tenant, require_permission
from app.core.schemas import (
    QuestionnaireTemplateCreate,
    QuestionnaireTemplateUpdate,
    QuestionnaireTemplateResponse,
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionnaireAssignmentCreate,
    QuestionnaireAssignmentResponse,
    AnswerSubmission,
    AnswerResponse,
)

router = APIRouter(prefix="/questionnaires", tags=["Questionnaires"])


# ================= TEMPLATES =================

@router.get("/templates", response_model=List[QuestionnaireTemplateResponse])
def list_templates(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    List questionnaire templates belonging to current tenant.
    """
    query = db.query(QuestionnaireTemplate).filter(
        QuestionnaireTemplate.organization_id == current_user.organization_id
    )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                QuestionnaireTemplate.title.ilike(search_fmt),
                QuestionnaireTemplate.framework_tag.ilike(search_fmt),
                QuestionnaireTemplate.description.ilike(search_fmt),
            )
        )

    if status_filter:
        try:
            status_enum = TemplateStatus(status_filter)
            query = query.filter(QuestionnaireTemplate.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid template status")

    templates = query.order_by(QuestionnaireTemplate.created_at.desc()).all()
    return templates


@router.post("/templates", response_model=QuestionnaireTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: QuestionnaireTemplateCreate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Create a reusable, versioned questionnaire template with initial questions.
    """
    try:
        status_enum = TemplateStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    template_id = str(uuid.uuid4())
    template = QuestionnaireTemplate(
        id=template_id,
        organization_id=current_user.organization_id,
        title=payload.title.strip(),
        description=payload.description,
        framework_tag=payload.framework_tag.strip(),
        status=status_enum,
        version=1,
    )
    db.add(template)
    db.flush()

    if payload.questions:
        for idx, q in enumerate(payload.questions):
            try:
                domain_enum = SecurityDomain(q.domain)
                qtype_enum = QuestionType(q.question_type)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid question domain or type: {e}")

            question = Question(
                id=str(uuid.uuid4()),
                template_id=template.id,
                order_index=q.order_index if q.order_index != 0 else idx,
                domain=domain_enum,
                text=q.text.strip(),
                guidance=q.guidance,
                question_type=qtype_enum,
                weight=q.weight,
                is_mandatory=q.is_mandatory,
                requires_evidence=q.requires_evidence,
            )
            db.add(question)

    db.commit()
    db.refresh(template)
    return template


@router.get("/templates/{template_id}", response_model=QuestionnaireTemplateResponse)
def get_template(
    template_id: str,
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    Get full template details and questions. Enforces tenant boundary isolation.
    """
    template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.patch("/templates/{template_id}", response_model=QuestionnaireTemplateResponse)
def update_template(
    template_id: str,
    payload: QuestionnaireTemplateUpdate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if payload.title is not None:
        template.title = payload.title.strip()
    if payload.description is not None:
        template.description = payload.description
    if payload.framework_tag is not None:
        template.framework_tag = payload.framework_tag.strip()
    if payload.status is not None:
        try:
            template.status = TemplateStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    db.commit()
    db.refresh(template)
    return template


@router.post("/templates/{template_id}/version", response_model=QuestionnaireTemplateResponse)
def create_new_template_version(
    template_id: str,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Creates an immutable next version of an existing template, duplicating its questions.
    """
    base_template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not base_template:
        raise HTTPException(status_code=404, detail="Base template not found")

    new_version_num = base_template.version + 1
    new_template_id = str(uuid.uuid4())
    new_template = QuestionnaireTemplate(
        id=new_template_id,
        organization_id=current_user.organization_id,
        title=base_template.title,
        description=base_template.description,
        framework_tag=base_template.framework_tag,
        status=TemplateStatus.DRAFT,
        version=new_version_num,
    )
    db.add(new_template)
    db.flush()

    for q in base_template.questions:
        new_q = Question(
            id=str(uuid.uuid4()),
            template_id=new_template.id,
            order_index=q.order_index,
            domain=q.domain,
            text=q.text,
            guidance=q.guidance,
            question_type=q.question_type,
            weight=q.weight,
            is_mandatory=q.is_mandatory,
            requires_evidence=q.requires_evidence,
        )
        db.add(new_q)

    db.commit()
    db.refresh(new_template)
    return new_template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    return None


# ================= QUESTIONS =================

@router.post("/templates/{template_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question_to_template(
    template_id: str,
    payload: QuestionCreate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    try:
        domain_enum = SecurityDomain(payload.domain)
        qtype_enum = QuestionType(payload.question_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid domain or type: {e}")

    question = Question(
        id=str(uuid.uuid4()),
        template_id=template.id,
        order_index=payload.order_index,
        domain=domain_enum,
        text=payload.text.strip(),
        guidance=payload.guidance,
        question_type=qtype_enum,
        weight=payload.weight,
        is_mandatory=payload.is_mandatory,
        requires_evidence=payload.requires_evidence,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.patch("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: str,
    payload: QuestionUpdate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .join(QuestionnaireTemplate)
        .filter(
            Question.id == question_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.text is not None:
        question.text = payload.text.strip()
    if payload.guidance is not None:
        question.guidance = payload.guidance
    if payload.order_index is not None:
        question.order_index = payload.order_index
    if payload.domain is not None:
        try:
            question.domain = SecurityDomain(payload.domain)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid domain")
    if payload.question_type is not None:
        try:
            question.question_type = QuestionType(payload.question_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid question type")
    if payload.weight is not None:
        question.weight = payload.weight
    if payload.is_mandatory is not None:
        question.is_mandatory = payload.is_mandatory
    if payload.requires_evidence is not None:
        question.requires_evidence = payload.requires_evidence

    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: str,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .join(QuestionnaireTemplate)
        .filter(
            Question.id == question_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return None


# ================= ASSIGNMENTS =================

@router.post("/assignments", response_model=QuestionnaireAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_questionnaire_to_vendor(
    payload: QuestionnaireAssignmentCreate,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Dispatches a versioned questionnaire template to a third-party vendor.
    Snapshots template version to protect audit integrity.
    """
    # 1. Verify vendor belongs to tenant
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == payload.vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    # 2. Verify template belongs to tenant
    template = (
        db.query(QuestionnaireTemplate)
        .filter(
            QuestionnaireTemplate.id == payload.template_id,
            QuestionnaireTemplate.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Questionnaire template not found")

    assignment_id = str(uuid.uuid4())
    assignment = QuestionnaireAssignment(
        id=assignment_id,
        organization_id=current_user.organization_id,
        vendor_id=vendor.id,
        template_id=template.id,
        template_version=template.version,
        status=AssignmentStatus.PENDING,
        due_date=payload.due_date,
        assigned_to_email=payload.assigned_to_email or (vendor.contacts[0].email if vendor.contacts else None),
        notes=payload.notes,
        completion_percentage=0,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Attach vendor name & template title for display
    resp = QuestionnaireAssignmentResponse.model_validate(assignment)
    resp.vendor_name = vendor.name
    resp.template_title = f"{template.title} (v{template.version})"
    return resp


@router.get("/assignments", response_model=List[QuestionnaireAssignmentResponse])
def list_assignments(
    vendor_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    """
    List all dispatched questionnaire assignments within tenant.
    """
    query = db.query(QuestionnaireAssignment).filter(
        QuestionnaireAssignment.organization_id == current_user.organization_id
    )
    if vendor_id:
        query = query.filter(QuestionnaireAssignment.vendor_id == vendor_id)
    if status_filter:
        try:
            status_enum = AssignmentStatus(status_filter)
            query = query.filter(QuestionnaireAssignment.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid assignment status")

    assignments = query.order_by(QuestionnaireAssignment.created_at.desc()).all()
    results = []
    for a in assignments:
        item = QuestionnaireAssignmentResponse.model_validate(a)
        item.vendor_name = a.vendor.name if a.vendor else "Unknown Vendor"
        item.template_title = f"{a.template.title} (v{a.template_version})" if a.template else "Template"
        results.append(item)
    return results


@router.get("/assignments/{assignment_id}", response_model=QuestionnaireAssignmentResponse)
def get_assignment(
    assignment_id: str,
    current_user: User = Depends(require_permission("assessment:read")),
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(QuestionnaireAssignment)
        .filter(
            QuestionnaireAssignment.id == assignment_id,
            QuestionnaireAssignment.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    item = QuestionnaireAssignmentResponse.model_validate(assignment)
    item.vendor_name = assignment.vendor.name if assignment.vendor else "Unknown Vendor"
    item.template_title = f"{assignment.template.title} (v{assignment.template_version})" if assignment.template else "Template"
    return item


@router.post("/assignments/{assignment_id}/answers", response_model=AnswerResponse)
def submit_answer(
    assignment_id: str,
    payload: AnswerSubmission,
    current_user: User = Depends(require_permission("assessment:write")),
    db: Session = Depends(get_db),
):
    """
    Submit or update answer for a question.
    Enforces validation rule:
    - N/A and Partial responses MUST have a non-empty justification.
    """
    assignment = (
        db.query(QuestionnaireAssignment)
        .filter(
            QuestionnaireAssignment.id == assignment_id,
            QuestionnaireAssignment.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Find the question in assignment's template
    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.template_id == assignment.template_id,
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not part of assigned template")

    # Business Rule: N/A and Partial require justification
    normalized_val = payload.response_value.lower().strip()
    if normalized_val in ["na", "n/a", "partial"]:
        if not payload.justification or len(payload.justification.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A detailed justification (minimum 5 chars) is mandatory when answering '{payload.response_value}'",
            )

    # Check for existing answer
    existing_answer = db.query(QuestionAnswer).filter(
        QuestionAnswer.assignment_id == assignment.id,
        QuestionAnswer.question_id == question.id,
    ).first()

    if existing_answer:
        existing_answer.response_value = payload.response_value
        existing_answer.justification = payload.justification
        existing_answer.evidence_reference = payload.evidence_reference
        db.commit()
        db.refresh(existing_answer)
        answer = existing_answer
    else:
        answer = QuestionAnswer(
            id=str(uuid.uuid4()),
            assignment_id=assignment.id,
            question_id=question.id,
            response_value=payload.response_value,
            justification=payload.justification,
            evidence_reference=payload.evidence_reference,
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)

    # Update completion percentage
    total_questions = len(assignment.template.questions)
    answered_count = db.query(QuestionAnswer).filter(QuestionAnswer.assignment_id == assignment.id).count()
    if total_questions > 0:
        assignment.completion_percentage = int((answered_count / total_questions) * 100)
        if assignment.completion_percentage == 100:
            assignment.status = AssignmentStatus.COMPLETED
        else:
            assignment.status = AssignmentStatus.IN_PROGRESS
        db.commit()

    return answer

