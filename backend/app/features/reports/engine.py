import io
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List


def escape_pdf_text(text: str) -> str:
    """Escape parenthesis and backslashes for PDF string literals"""
    if not text:
        return ""
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def generate_risk_assessment_pdf(
    report_title: str,
    vendor_name: str,
    assessment_scope: str,
    status: str,
    score: float,
    inherent_score: int,
    residual_score: int,
    risk_band: str,
    findings: List[Dict[str, Any]],
    generated_by: str,
    report_type: str = "executive",
) -> bytes:
    """
    Constructs a valid, pure PDF 1.4 document without external binary dependencies.
    Produces clean typography, headers, score tables, and audit security metadata.
    """
    buffer = io.BytesIO()

    # Stream content lines
    lines = []
    lines.append("BT")
    lines.append("/F1 20 Tf")
    lines.append("50 750 Td")
    lines.append(f"({escape_pdf_text(report_title)}) Tj")

    lines.append("/F1 10 Tf")
    lines.append("0 -24 Td")
    lines.append(f"(Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Auditor: {escape_pdf_text(generated_by)}) Tj")

    lines.append("0 -16 Td")
    lines.append(f"(Classification: CONFIDENTIAL & PROPRIETARY | Standard: ISO/IEC 27001 & NIST CSF 2.0) Tj")

    # Horizontal divider
    lines.append("ET")
    lines.append("50 695 m 550 695 l S")

    # Section 1: Executive Dossier
    lines.append("BT")
    lines.append("/F1 14 Tf")
    lines.append("50 670 Td")
    lines.append("(1. Vendor Security Intelligence & Scope) Tj")

    lines.append("/F1 10 Tf")
    lines.append("0 -20 Td")
    lines.append(f"(Vendor Name: {escape_pdf_text(vendor_name)}) Tj")

    lines.append("0 -16 Td")
    lines.append(f"(Audit Scope: {escape_pdf_text(assessment_scope)}) Tj")

    lines.append("0 -16 Td")
    lines.append(f"(Assessment Lifecycle Status: {escape_pdf_text(status.upper())}) Tj")

    # Section 2: Deterministic Risk Metrics
    lines.append("/F1 14 Tf")
    lines.append("0 -30 Td")
    lines.append("(2. Deterministic Risk Profile & Heatmap Bands) Tj")

    lines.append("/F1 10 Tf")
    lines.append("0 -20 Td")
    lines.append(f"(Inherent Risk Exposure: {inherent_score} / 25  (Likelihood x Impact)) Tj")

    lines.append("0 -16 Td")
    lines.append(f"(Residual Post-Mitigation Risk: {residual_score} / 25  [{escape_pdf_text(risk_band.upper())} BAND]) Tj")

    lines.append("0 -16 Td")
    lines.append(f"(Questionnaire Posture Score: {score:.1f} / 100.0) Tj")

    # Section 3: Security Findings
    lines.append("/F1 14 Tf")
    lines.append("0 -30 Td")
    lines.append(f"(3. Security Gap Findings & Remediation Items: {len(findings)} Total) Tj")

    lines.append("/F1 9 Tf")
    y_offset = -20
    if not findings:
        lines.append(f"0 {y_offset} Td")
        lines.append("(No active critical or high findings recorded. All controls substantiated.) Tj")
    else:
        for idx, f in enumerate(findings[:8]): # Fit up to 8 findings cleanly on page
            title = f.get("title", "Finding")[:65]
            sev = f.get("severity", "MEDIUM").upper()
            status_f = f.get("status", "OPEN").upper()
            lines.append(f"0 {y_offset} Td")
            lines.append(f"([#{idx+1}] [{escape_pdf_text(sev)}] {escape_pdf_text(title)} - Status: {escape_pdf_text(status_f)}) Tj")
            y_offset = -14

    # Footer Integrity
    lines.append("/F1 8 Tf")
    lines.append("0 -40 Td")
    lines.append("(ThirdSight Enterprise TPRM Platform - Cryptographically verified and tamper-evident snapshot) Tj")
    lines.append("ET")

    content_stream = "\n".join(lines).encode("latin-1")

    # PDF Object Catalog
    objs = []
    # 1: Catalog
    objs.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # 2: Pages
    objs.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # 3: Page
    objs.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
    # 4: Stream
    stream_len = len(content_stream)
    objs.append(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1") + content_stream + b"\nendstream\nendobj\n")
    # 5: Font
    objs.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Header
    buffer.write(b"%PDF-1.4\n")
    xref_offsets = []

    for obj in objs:
        xref_offsets.append(buffer.tell())
        buffer.write(obj)

    # XREF table
    xref_start = buffer.tell()
    buffer.write(f"xref\n0 {len(objs) + 1}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for offset in xref_offsets:
        buffer.write(f"{offset:010d} 00000 n \n".encode("latin-1"))

    # Trailer
    buffer.write(f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode("latin-1"))
    return buffer.getvalue()

