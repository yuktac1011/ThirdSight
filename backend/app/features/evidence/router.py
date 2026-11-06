import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import (
    User,
    Evidence,
    EvidenceStatus,
    RejectionReason,
    Vendor,
    Assessment,
    Question,
)
from app.core.schemas import EvidenceResponse, EvidenceReviewRequest
from app.core.dependencies import require_permission
from app.core.storage import storage_manager
from app.core.config import settings
from app.features.evidence.worker import process_quarantined_evidence

router = APIRouter(prefix="/evidence", tags=["Evidence & Document Management"])


@router.post("/upload", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    vendor_id: str = Form(...),
    assessment_id: Optional[str] = Form(None),
    question_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_permission("evidence:write")),
    db: Session = Depends(get_db),
):
    """
    Secure evidence upload:
    - Verifies vendor and assessment ownership under tenant context.
    - Checks file size limits (max 25MB).
    - Stores file in quarantine storage zone.
    - Triggers isolated signature & antivirus processing worker.
    """
    # 1. Tenant & Vendor Verification
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.organization_id == current_user.organization_id,
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    # 2. Assessment Verification if supplied
    if assessment_id:
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.organization_id == current_user.organization_id,
        ).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found in organization")

    # 3. Read and check file size
    content = await file.read()
    if len(content) > settings.MAX_EVIDENCE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum permitted size of {settings.MAX_EVIDENCE_SIZE_BYTES // (1024*1024)}MB",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file",
        )

    # 4. Put into quarantine storage
    storage_key, sha256_hash = storage_manager.put_quarantine(content, file.filename or "evidence.bin")

    # 5. Create database record in QUARANTINED state
    evidence = Evidence(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        vendor_id=vendor.id,
        assessment_id=assessment_id,
        question_id=question_id,
        file_name=file.filename or "evidence.bin",
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        sha256_hash=sha256_hash,
        storage_key=storage_key,
        status=EvidenceStatus.QUARANTINED,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # 6. Execute background quarantine scanning worker
    processed_evidence = process_quarantined_evidence(evidence.id, db)
    if not processed_evidence:
        processed_evidence = evidence

    resp = EvidenceResponse.model_validate(processed_evidence)
    resp.vendor_name = vendor.name
    return resp


@router.get("", response_model=List[EvidenceResponse])
def list_evidence(
    vendor_id: Optional[str] = Query(None),
    assessment_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("evidence:read")),
    db: Session = Depends(get_db),
):
    """List tenant-scoped evidence with optional filtering"""
    query = db.query(Evidence).filter(Evidence.organization_id == current_user.organization_id)
    if vendor_id:
        query = query.filter(Evidence.vendor_id == vendor_id)
    if assessment_id:
        query = query.filter(Evidence.assessment_id == assessment_id)
    if status_filter:
        query = query.filter(Evidence.status == status_filter)

    items = query.order_by(Evidence.created_at.desc()).all()
    results = []
    for ev in items:
        resp = EvidenceResponse.model_validate(ev)
        resp.vendor_name = ev.vendor.name if ev.vendor else "Unknown Vendor"
        results.append(resp)
    return results


@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence_detail(
    evidence_id: str,
    current_user: User = Depends(require_permission("evidence:read")),
    db: Session = Depends(get_db),
):
    """Retrieve metadata and scanning result of a specific evidence artifact"""
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.organization_id == current_user.organization_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    resp = EvidenceResponse.model_validate(evidence)
    resp.vendor_name = evidence.vendor.name if evidence.vendor else "Unknown Vendor"
    return resp


@router.get("/{evidence_id}/download")
def download_evidence(
    evidence_id: str,
    current_user: User = Depends(require_permission("evidence:read")),
    db: Session = Depends(get_db),
):
    """
    Download verified evidence artifact binary stream with Content-Disposition headers.
    Restricts download if evidence was flagged as a malicious payload.
    """
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.organization_id == current_user.organization_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    if evidence.status == EvidenceStatus.REJECTED and evidence.rejection_reason == RejectionReason.MALICIOUS_PAYLOAD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Download blocked: Evidence artifact is quarantined due to malicious payload detection.",
        )

    file_bytes = storage_manager.get_file_bytes(evidence.storage_key)
    if not file_bytes:
        raise HTTPException(status_code=404, detail="Stored artifact binary missing")

    return Response(
        content=file_bytes,
        media_type=evidence.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{evidence.file_name}"',
            "X-Content-Type-Options": "nosniff",
            "X-Evidence-SHA256": evidence.sha256_hash,
        },
    )


@router.post("/{evidence_id}/review", response_model=EvidenceResponse)
def review_evidence(
    evidence_id: str,
    payload: EvidenceReviewRequest,
    current_user: User = Depends(require_permission("evidence:review")),
    db: Session = Depends(get_db),
):
    """
    SecOps analyst decision on uploaded evidence:
    - approve: validates artifact is acceptable for audits.
    - reject: records rejection reason code and required remediation notes.
    """
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.organization_id == current_user.organization_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    action = payload.action.lower().strip()
    if action == "approve":
        evidence.status = EvidenceStatus.APPROVED
        evidence.rejection_reason = None
        evidence.rejection_comment = None
    elif action == "reject":
        evidence.status = EvidenceStatus.REJECTED
        try:
            evidence.rejection_reason = RejectionReason(payload.rejection_reason) if payload.rejection_reason else RejectionReason.OTHER
        except ValueError:
            evidence.rejection_reason = RejectionReason.OTHER
        evidence.rejection_comment = payload.rejection_comment or "Rejected by SecOps reviewer"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported review action '{payload.action}'. Use 'approve' or 'reject'.",
        )

    evidence.reviewer_email = current_user.email
    evidence.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(evidence)

    resp = EvidenceResponse.model_validate(evidence)
    resp.vendor_name = evidence.vendor.name if evidence.vendor else "Unknown Vendor"
    return resp


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence(
    evidence_id: str,
    current_user: User = Depends(require_permission("evidence:write")),
    db: Session = Depends(get_db),
):
    """Deletes evidence record and underlying storage object"""
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.organization_id == current_user.organization_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    storage_manager.delete_file(evidence.storage_key)
    db.delete(evidence)
    db.commit()
    return None

