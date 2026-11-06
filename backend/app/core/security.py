from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from jose import jwt, JWTError
import requests
from app.core.config import settings

# Built-in permissions mapping for enterprise TPRM
STANDARD_ROLES_PERMISSIONS = {
    "admin": [
        "org:read", "org:update", "org:delete",
        "user:read", "user:create", "user:update", "user:delete", "user:invite",
        "vendor:read", "vendor:write",
        "assessment:read", "assessment:write", "assessment:evaluate",
        "evidence:read", "evidence:write", "evidence:review",
        "control:read", "control:write",
        "risk:read", "risk:calculate", "risk:accept", "remediation:write",
        "ai:read", "ai:analyze", "ai:review",
        "report:read", "report:generate",
        "audit:read",
    ],
    "analyst": [
        "org:read",
        "user:read",
        "vendor:read", "vendor:write",
        "assessment:read", "assessment:write", "assessment:evaluate",
        "evidence:read", "evidence:write", "evidence:review",
        "control:read", "control:write",
        "risk:read", "risk:calculate", "remediation:write",
        "ai:read", "ai:analyze", "ai:review",
        "report:read", "report:generate",
    ],
    "auditor": [
        "org:read",
        "user:read",
        "vendor:read",
        "assessment:read",
        "evidence:read",
        "control:read",
        "risk:read",
        "ai:read",
        "report:read",
        "audit:read",
    ],
    "vendor_user": [
        "assessment:read",
        "assessment:write", # response submission
        "evidence:read",
        "evidence:write", # evidence attachment upload
    ]
}


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create local signed JWT token (useful for test/dev/mock-OIDC token generation)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate token signature (supports Keycloak RS256 JWKS or local HS256)"""
    # First try local HS256 (standard application/test tokens)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        pass

    # If Keycloak is enabled and configured, attempt JWKS verification
    if settings.KEYCLOAK_URL and settings.KEYCLOAK_REALM:
        try:
            jwks_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
            jwks = requests.get(jwks_url, timeout=3).json()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=settings.KEYCLOAK_CLIENT_ID,
                options={"verify_aud": bool(settings.KEYCLOAK_CLIENT_ID)}
            )
            return payload
        except Exception:
            raise JWTError("Invalid token or signature verification failed")

    raise JWTError("Invalid token")

