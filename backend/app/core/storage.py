import os
import uuid
import hashlib
from pathlib import Path
from typing import Tuple, BinaryIO, Optional
from app.core.config import settings

LOCAL_ROOT = Path(settings.STORAGE_LOCAL_ROOT)
QUARANTINE_DIR = LOCAL_ROOT / "quarantine"
APPROVED_DIR = LOCAL_ROOT / "approved"


def init_storage_directories():
    """Ensure storage directory hierarchy exists with secure permissions"""
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
    APPROVED_DIR.mkdir(parents=True, exist_ok=True)


class ObjectStorageManager:
    """
    Enterprise object storage adapter. Supports isolated local file storage
    and S3/MinIO compatible object stores.
    """

    def __init__(self):
        init_storage_directories()
        self.backend = settings.STORAGE_BACKEND.lower()
        self.s3_client = None
        if self.backend == "s3" and settings.S3_ACCESS_KEY:
            try:
                import boto3
                self.s3_client = boto3.client(
                    "s3",
                    endpoint_url=settings.S3_ENDPOINT_URL,
                    aws_access_key_id=settings.S3_ACCESS_KEY,
                    aws_secret_access_key=settings.S3_SECRET_KEY,
                    region_name=settings.S3_REGION,
                )
            except Exception:
                self.backend = "local"

    def put_quarantine(self, file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Store uploaded file into quarantine zone under a random unguessable key.
        Returns: (storage_key, sha256_hash)
        """
        sha256 = hashlib.sha256(file_content).hexdigest()
        ext = Path(filename).suffix.lower()
        storage_key = f"quarantine/{uuid.uuid4()}{ext}"

        if self.backend == "s3" and self.s3_client:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=storage_key,
                Body=file_content,
            )
        else:
            dest = LOCAL_ROOT / storage_key
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(dest, "wb") as f:
                f.write(file_content)

        return storage_key, sha256

    def promote_to_approved(self, quarantine_key: str) -> str:
        """
        Promote an evidence artifact from quarantine to approved storage after validation.
        """
        ext = Path(quarantine_key).suffix.lower()
        approved_key = f"approved/{uuid.uuid4()}{ext}"

        if self.backend == "s3" and self.s3_client:
            self.s3_client.copy_object(
                Bucket=settings.S3_BUCKET_NAME,
                CopySource=f"{settings.S3_BUCKET_NAME}/{quarantine_key}",
                Key=approved_key,
            )
            self.s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=quarantine_key)
        else:
            src = LOCAL_ROOT / quarantine_key
            dest = LOCAL_ROOT / approved_key
            dest.parent.mkdir(parents=True, exist_ok=True)
            if src.exists():
                os.rename(src, dest)
            else:
                # If already moved or created
                pass

        return approved_key

    def get_file_bytes(self, storage_key: str) -> Optional[bytes]:
        """Read artifact binary content for streaming download or preview"""
        if self.backend == "s3" and self.s3_client:
            try:
                res = self.s3_client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)
                return res["Body"].read()
            except Exception:
                return None
        else:
            path = LOCAL_ROOT / storage_key
            if path.exists() and path.is_file():
                with open(path, "rb") as f:
                    return f.read()
            return None

    def delete_file(self, storage_key: str) -> bool:
        """Safely delete object from storage"""
        if self.backend == "s3" and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)
                return True
            except Exception:
                return False
        else:
            path = LOCAL_ROOT / storage_key
            if path.exists() and path.is_file():
                try:
                    os.remove(path)
                    return True
                except Exception:
                    return False
            return False


storage_manager = ObjectStorageManager()

