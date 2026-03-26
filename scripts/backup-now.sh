#!/bin/bash
# OHCS E-Library — Trigger Manual Backup
#
# Usage:
#   ./scripts/backup-now.sh <admin-jwt-token> [type]
#
#   type  optional — "manual" (default) or "auto"
#
# To make executable:
#   chmod +x scripts/backup-now.sh
#
# Requirements: curl, python3

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
API_BASE="https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1"
TOKEN="${1:-}"
BACKUP_TYPE="${2:-manual}"

# ── Helpers ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Preflight ────────────────────────────────────────────────────────────────
if [ -z "$TOKEN" ]; then
  echo "Usage: ./scripts/backup-now.sh <admin-jwt-token> [type]"
  echo ""
  echo "  type  — 'manual' (default) or 'auto'"
  exit 1
fi

if ! command -v curl &>/dev/null; then
  echo "Error: curl is required but not installed." >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required but not installed." >&2
  exit 1
fi

# ── Trigger backup ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}OHCS E-Library — Creating $BACKUP_TYPE backup...${RESET}"
echo -e "${CYAN}API: $API_BASE${RESET}"
echo ""

RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}" \
  -X POST "$API_BASE/backup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"$BACKUP_TYPE\"}")

HTTP_STATUS=$(echo "$RESPONSE" | grep -o '__HTTP_STATUS__[0-9]*' | cut -d_ -f4)
BODY=$(echo "$RESPONSE" | sed 's/__HTTP_STATUS__[0-9]*$//')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  # Pretty-print the relevant fields
  python3 - <<PYEOF
import json, sys

raw = '''$BODY'''
try:
    d = json.loads(raw)
except Exception as e:
    print(f"Could not parse response: {e}")
    print(raw[:500])
    sys.exit(1)

backup = d.get('backup', {})
tables = backup.get('tables', {})

print(f"  Status        : SUCCESS (HTTP $HTTP_STATUS)")
print(f"  Backup ID     : {backup.get('id', '?')}")
print(f"  Type          : {backup.get('type', '?')}")
print(f"  Size          : {backup.get('sizeFormatted', '?')} ({backup.get('size', '?')} bytes)")
print(f"  Total rows    : {backup.get('totalRows', '?')}")
print(f"  Created at    : {backup.get('createdAt', '?')}")
print(f"  Content hash  : {backup.get('contentHash', '?')[:24]}..." if backup.get('contentHash') else "  Content hash  : —")

if tables:
    non_empty = {t: r for t, r in tables.items() if r > 0}
    empty     = [t for t, r in tables.items() if r == 0]
    print(f"\n  Tables exported : {len(tables)} ({len(non_empty)} with data, {len(empty)} empty)")
    print("  ─────────────────────────────────────────")
    for name, rows in sorted(non_empty.items()):
        print(f"    {name:<35} {rows:>6} rows")
    if empty:
        print(f"\n  Empty tables: {', '.join(sorted(empty))}")
PYEOF

  echo ""
  echo -e "${GREEN}${BOLD}Backup completed successfully.${RESET}"
  echo ""
  echo "  To verify this backup, run:"
  BACKUP_ID=$(python3 -c "import json; d=json.loads('''$BODY'''); print(d.get('backup',{}).get('id',''))" 2>/dev/null || true)
  echo "    ./scripts/verify-backup.sh <admin-token>"
  echo ""
  echo "  To list all backups:"
  echo "    curl -s -H 'Authorization: Bearer <token>' $API_BASE/backup | python3 -m json.tool"
  echo ""
  exit 0

elif [ "$HTTP_STATUS" = "429" ]; then
  echo -e "${RED}${BOLD}Rate limit reached.${RESET}"
  echo "  The API allows a maximum of 5 manual backups per hour per user."
  echo "  Response: $(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error','?'))" 2>/dev/null || echo "$BODY" | head -c 200)"
  exit 1

elif [ "$HTTP_STATUS" = "403" ]; then
  echo -e "${RED}${BOLD}Unauthorized (HTTP 403).${RESET}"
  echo "  The provided token does not have admin, super_admin, or director privileges."
  exit 1

elif [ "$HTTP_STATUS" = "401" ]; then
  echo -e "${RED}${BOLD}Authentication failed (HTTP 401).${RESET}"
  echo "  The token is missing, expired, or invalid."
  exit 1

else
  echo -e "${RED}${BOLD}Backup failed (HTTP $HTTP_STATUS).${RESET}"
  echo "  Response: $(echo "$BODY" | head -c 400)"
  exit 1
fi
