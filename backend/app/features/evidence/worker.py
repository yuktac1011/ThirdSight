import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.models import Evidence, EvidenceStatus, RejectionReason
from app.core.storage import storage_manager
from app.features.evidence.validator import validate_and_scan_evidence

logger = logging.getLogger(__name__)


def process_quarantined_evidence(evidence_id: str, db: Session) -> Evidence:
    """
    Isolated processing task for an uploaded evidence artifact:
    1. Reads bytes from quarantine storage.
    2. Runs deep signature, macro, and virus scanning.
    3. If malicious or invalid, flags as REJECTED with rejection reason.
    4. If clean, promotes storage object to approved prefix and sets status to APPROVED.
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        logger.error(f"Evidence {evidence_id} not found for background processing")
        return None

    evidence.status = EvidenceStatus.SCANNING
    db.commit()

    file_bytes = storage_manager.get_file_bytes(evidence.storage_key)
    if not file_bytes:
        evidence.status = EvidenceStatus.REJECTED
        evidence.rejection_reason = RejectionReason.TAMPERED_OR_CORRUPT
        evidence.rejection_comment = "Artifact not found in object storage."
        db.commit()
        return evidence

    validation = validate_and_scan_evidence(file_bytes, evidence.file_name)

    if validation.is_malicious:
        evidence.status = EvidenceStatus.REJECTED
        evidence.rejection_reason = RejectionReason.MALICIOUS_PAYLOAD
        evidence.rejection_comment = validation.message
        evidence.scan_result = f"THREAT DETECTED: {validation.message}"
        db.commit()
        logger.warning(f"Malicious evidence quarantined and rejected: {evidence_id}")
        return evidence

    if not validation.is_valid:
        evidence.status = EvidenceStatus.REJECTED
        evidence.rejection_reason = RejectionReason.MIME_MISMATCH
        evidence.rejection_comment = validation.message
        evidence.scan_result = f"INVALID: {validation.message}"
        db.commit()
        logger.info(f"Invalid format evidence rejected: {evidence_id}")
        return evidence

    # File is valid and clean -> promote to approved storage
    try:
        approved_key = storage_manager.promote_to_approved(evidence.storage_key)
        evidence.storage_key = approved_key
        evidence.status = EvidenceStatus.APPROVED
        evidence.scan_result = validation.message
        evidence.extracted_text_preview = validation.extracted_text
        evidence.mime_type = validation.detected_mime
        db.commit()
        logger.info(f"Evidence {evidence_id} validated and promoted to approved storage.")
    except Exception as e:
        evidence.status = EvidenceStatus.REJECTED
        evidence.rejection_reason = RejectionReason.TAMPERED_OR_CORRUPT
        evidence.rejection_comment = f"Promotion error: {str(e)}"
        db.commit()

    return evidence

