import zipfile
import io
from typing import Tuple, Optional
from pathlib import Path

# Standard EICAR string for testing antivirus quarantine
EICAR_STANDARD_VIRUS_SIG = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"

# Allowed MIME and Magic Signatures
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".csv", ".txt"}

PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04" # Standard header for docx and xlsx archives
EXE_MAGIC = b"MZ"
ELF_MAGIC = b"\x7fELF"


class FileValidationResult:
    def __init__(
        self,
        is_valid: bool,
        is_malicious: bool,
        detected_mime: str,
        message: str,
        extracted_text: Optional[str] = None
    ):
        self.is_valid = is_valid
        self.is_malicious = is_malicious
        self.detected_mime = detected_mime
        self.message = message
        self.extracted_text = extracted_text


def validate_and_scan_evidence(file_bytes: bytes, filename: str) -> FileValidationResult:
    """
    Validates file headers, detects MIME spoofing, scans for malicious test payloads,
    and extracts a clean text snippet.
    """
    ext = Path(filename).suffix.lower()

    # 1. Antivirus / Malicious Signature Detection
    if EICAR_STANDARD_VIRUS_SIG in file_bytes:
        return FileValidationResult(
            is_valid=False,
            is_malicious=True,
            detected_mime="application/x-dosexec",
            message="Antivirus quarantine trigger: EICAR test signature identified in uploaded stream.",
        )

    # 2. Executable Header Inspection (Disallow binaries disguised as documents)
    if file_bytes.startswith(EXE_MAGIC) or file_bytes.startswith(ELF_MAGIC):
        return FileValidationResult(
            is_valid=False,
            is_malicious=True,
            detected_mime="application/x-dosexec",
            message="Malicious payload rejected: Executable binary header detected.",
        )

    # 3. Check allowed extension
    if ext not in ALLOWED_EXTENSIONS:
        return FileValidationResult(
            is_valid=False,
            is_malicious=False,
            detected_mime="application/octet-stream",
            message=f"Disallowed file extension '{ext}'. Only PDF, DOCX, XLSX, CSV, and TXT are accepted.",
        )

    # 4. Deep format validation & text extraction
    if ext == ".pdf":
        if not file_bytes.startswith(PDF_MAGIC):
            return FileValidationResult(
                is_valid=False,
                is_malicious=False,
                detected_mime="application/octet-stream",
                message="MIME spoofing detected: File has .pdf extension but lacks standard %PDF header.",
            )
        # Extract basic text snippet if possible
        extracted_preview = None
        try:
            # Fallback naive text extraction
            text_chunks = []
            for stream_chunk in file_bytes.split(b"stream"):
                if len(text_chunks) > 10:
                    break
                sample = stream_chunk[:200]
                cleaned = "".join(chr(b) for b in sample if 32 <= b <= 126)
                if len(cleaned) > 20:
                    text_chunks.append(cleaned)
            extracted_preview = " ".join(text_chunks)[:400] or "PDF Document verified. Valid structural header."
        except Exception:
            extracted_preview = "PDF Document verified."

        return FileValidationResult(
            is_valid=True,
            is_malicious=False,
            detected_mime="application/pdf",
            message="File passed signature validation and heuristic scan.",
            extracted_text=extracted_preview,
        )

    elif ext in [".docx", ".xlsx"]:
        if not file_bytes.startswith(ZIP_MAGIC):
            return FileValidationResult(
                is_valid=False,
                is_malicious=False,
                detected_mime="application/octet-stream",
                message=f"MIME spoofing detected: {ext.upper()} lacks OpenPackaging zip container signature.",
            )
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as zf:
                namelist = zf.namelist()
                if ext == ".docx" and not any("word/" in n for n in namelist):
                    return FileValidationResult(
                        is_valid=False,
                        is_malicious=False,
                        detected_mime="application/zip",
                        message="Invalid DOCX container: Missing word/ document tree.",
                    )
                if ext == ".xlsx" and not any("xl/" in n for n in namelist):
                    return FileValidationResult(
                        is_valid=False,
                        is_malicious=False,
                        detected_mime="application/zip",
                        message="Invalid XLSX container: Missing xl/ workbook tree.",
                    )
                # Check for macro components
                if any("vbaProject.bin" in n for n in namelist):
                    return FileValidationResult(
                        is_valid=False,
                        is_malicious=True,
                        detected_mime="application/vnd.ms-office.vba",
                        message="Security quarantine: Embedded VBA executable macros are strictly forbidden.",
                    )
        except zipfile.BadZipFile:
            return FileValidationResult(
                is_valid=False,
                is_malicious=False,
                detected_mime="application/octet-stream",
                message="Corrupt archive: File could not be unpacked as a valid Office Open XML container.",
            )

        detected = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext == ".docx" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        return FileValidationResult(
            is_valid=True,
            is_malicious=False,
            detected_mime=detected,
            message="Office Open XML archive validated with zero embedded macros.",
            extracted_text=f"Valid {ext[1:].upper()} document container with {len(namelist)} internal streams.",
        )

    elif ext in [".csv", ".txt"]:
        # Verify no binary null bytes
        if b"\x00" in file_bytes:
            return FileValidationResult(
                is_valid=False,
                is_malicious=False,
                detected_mime="application/octet-stream",
                message="Binary data or null bytes detected in plain text/CSV stream.",
            )
        try:
            text_str = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text_str = file_bytes.decode("latin-1")
            except Exception:
                return FileValidationResult(
                    is_valid=False,
                    is_malicious=False,
                    detected_mime="application/octet-stream",
                    message="Text encoding could not be decoded as UTF-8 or Latin-1.",
                )
        return FileValidationResult(
            is_valid=True,
            is_malicious=False,
            detected_mime="text/csv" if ext == ".csv" else "text/plain",
            message="Text document validated cleanly.",
            extracted_text=text_str[:500],
        )

    return FileValidationResult(
        is_valid=False,
        is_malicious=False,
        detected_mime="application/octet-stream",
        message="Unsupported file type.",
    )

