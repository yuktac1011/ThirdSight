#!/bin/bash
# ThirdSight Enterprise Automated Backup & Verification Script
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/thirdsight}"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER="thirdsight_db"
POSTGRES_USER="thirdsight"
POSTGRES_DB="thirdsight_prod"

mkdir -p "$BACKUP_DIR"

echo "=== [$(date)] Starting ThirdSight Automated Backup ==="

# 1. Database SQL Dump
DUMP_FILE="$BACKUP_DIR/db_${DATE}.sql.gz"
echo "Creating PostgreSQL backup: $DUMP_FILE"
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$DUMP_FILE"

# 2. Checksum Verification
SHA256=$(sha256sum "$DUMP_FILE" | awk '{print $1}')
echo "$SHA256  db_${DATE}.sql.gz" > "$DUMP_FILE.sha256"
echo "Backup SHA-256 Checksum: $SHA256"

# 3. Retention Cleanup (Keep last 14 daily backups)
echo "Pruning backups older than 14 days..."
find "$BACKUP_DIR" -type f -name "db_*.sql.gz*" -mtime +14 -delete

echo "=== Backup Completed Successfully ==="

