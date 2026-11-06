import re
from typing import Tuple

# Common prompt injection patterns and jailbreak trigger tokens
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s*:\s*",
    r"disregard\s+(all\s+)?rules",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"jailbreak",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"override\s+system\s+prompt",
]

COMPILED_INJECTIONS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def sanitize_untrusted_document_text(text: str) -> Tuple[str, bool, str]:
    """
    Sanitizes untrusted text extracted from vendor-uploaded files before feeding
    to AI models.
    Returns: (cleaned_text, was_sanitized, log_message)
    """
    if not text:
        return "", False, "Empty input"

    was_sanitized = False
    cleaned_text = text

    for pattern in COMPILED_INJECTIONS:
        if pattern.search(cleaned_text):
            was_sanitized = True
            cleaned_text = pattern.sub("[REDACTED_PROMPT_INJECTION_ATTEMPT]", cleaned_text)

    log_message = "Clean - no prompt injection patterns detected."
    if was_sanitized:
        log_message = "WARNING: Suspicious adversarial prompt injection tokens detected and redacted."

    # Limit length to prevent context explosion
    max_chars = 15000
    if len(cleaned_text) > max_chars:
        cleaned_text = cleaned_text[:max_chars] + "\n...[TRUNCATED FOR CONTEXT WINDOW]"

    return cleaned_text, was_sanitized, log_message

