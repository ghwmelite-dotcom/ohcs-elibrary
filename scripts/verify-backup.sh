#!/bin/bash
# OHCS E-Library Backup Verification Script
#
# Usage:
#   ./scripts/verify-backup.sh <admin-jwt-token>
#
# To make executable:
#   chmod +x scripts/verify-backup.sh
#
# Requirements: curl, python3 (both standard on macOS/Linux)

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
API_BASE="${API_BASE:-https://api.ohcselibrary.xyz/api/v1}"
TOKEN="${1:-}"
WORK_FILE="/tmp/ohcs-backup-verify-$$.json"

# Tables that the backup route guarantees to export (mirrors BACKUP_TABLES in
# workers/src/routes/backup.ts). These are the tables that MUST be present.
CRITICAL_TABLES=(
  users
  roles
  user_roles
  documents
  bookmarks
  forum_categories
  forum_topics
  forum_posts
  news_articles
  notifications
  counselor_sessions
  counselor_messages
  mood_entries
)

# ── Helpers ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass() { echo -e "  ${GREEN}PASS${RESET}  $*"; }
fail() { echo -e "  ${RED}FAIL${RESET}  $*"; }
info() { echo -e "  ${CYAN}INFO${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}WARN${RESET}  $*"; }
step() { echo -e "\n${BOLD}[$1/5]${RESET} $2"; }

cleanup() {
  rm -f "$WORK_FILE"
}
trap cleanup EXIT

# ── Preflight ────────────────────────────────────────────────────────────────
if [ -z "$TOKEN" ]; then
  echo "Usage: ./scripts/verify-backup.sh <admin-jwt-token>"
  echo ""
  echo "Obtain a token by logging in as an admin and copying the JWT from"
  echo "the Authorization header or from local storage in the browser."
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

# ── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}      OHCS E-Library — Backup Verification          ${RESET}"
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
echo "  API: $API_BASE"
echo "  Run: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

OVERALL_PASS=true

# ── Step 1: Create backup ─────────────────────────────────────────────────────
step 1 "Creating manual backup..."

CREATE_RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}" \
  -X POST "$API_BASE/backup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"manual"}')

CREATE_STATUS=$(echo "$CREATE_RESPONSE" | grep -o '__HTTP_STATUS__[0-9]*' | cut -d_ -f4)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed 's/__HTTP_STATUS__[0-9]*$//')

if [ "$CREATE_STATUS" = "200" ] || [ "$CREATE_STATUS" = "201" ]; then
  BACKUP_KEY=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('backup',{}).get('id',''))" <<< "$CREATE_BODY" 2>/dev/null || true)
  TOTAL_ROWS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('backup',{}).get('totalRows','?'))" <<< "$CREATE_BODY" 2>/dev/null || true)
  CONTENT_HASH=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); h=d.get('backup',{}).get('contentHash',''); print(h[:16]+'...' if h else '')" <<< "$CREATE_BODY" 2>/dev/null || true)
  pass "Backup created — $TOTAL_ROWS total rows  |  hash: $CONTENT_HASH"
else
  fail "HTTP $CREATE_STATUS — could not create backup"
  echo "  Response: $(echo "$CREATE_BODY" | head -c 300)"
  OVERALL_PASS=false
fi

# ── Step 2: List backups and locate latest ────────────────────────────────────
step 2 "Fetching backup list and locating latest backup..."

LIST_RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}" \
  "$API_BASE/backup" \
  -H "Authorization: Bearer $TOKEN")

LIST_STATUS=$(echo "$LIST_RESPONSE" | grep -o '__HTTP_STATUS__[0-9]*' | cut -d_ -f4)
LIST_BODY=$(echo "$LIST_RESPONSE" | sed 's/__HTTP_STATUS__[0-9]*$//')

LATEST_KEY=""
LATEST_CREATED=""

if [ "$LIST_STATUS" = "200" ]; then
  LATEST_KEY=$(python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
backups = data.get('backups', [])
if backups:
    print(backups[0].get('id', ''))
" <<< "$LIST_BODY" 2>/dev/null || true)

  LATEST_CREATED=$(python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
backups = data.get('backups', [])
if backups:
    print(backups[0].get('createdAt', ''))
" <<< "$LIST_BODY" 2>/dev/null || true)

  TOTAL_BACKUPS=$(python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
print(data.get('total', '?'))
" <<< "$LIST_BODY" 2>/dev/null || true)

  if [ -n "$LATEST_KEY" ]; then
    pass "Found $TOTAL_BACKUPS backup(s) — latest: $LATEST_KEY"
    info "Created at: $LATEST_CREATED"
  else
    fail "Backup list returned but contained no entries"
    OVERALL_PASS=false
  fi
else
  fail "HTTP $LIST_STATUS — could not fetch backup list"
  echo "  Response: $(echo "$LIST_BODY" | head -c 300)"
  OVERALL_PASS=false
fi

if [ "$OVERALL_PASS" = false ]; then
  echo ""
  echo -e "${RED}${BOLD}═══ BACKUP VERIFICATION: FAILED (could not locate backup) ═══${RESET}"
  exit 1
fi

# ── Step 3: Download backup ───────────────────────────────────────────────────
step 3 "Downloading backup file..."

# The backup key contains slashes (e.g. backups/manual_…json) — URL-encode it
ENCODED_KEY=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$LATEST_KEY")

HTTP_CODE=$(curl -s -w "%{http_code}" \
  "$API_BASE/backup/$ENCODED_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$WORK_FILE")

if [ "$HTTP_CODE" = "200" ]; then
  FILE_BYTES=$(wc -c < "$WORK_FILE" | tr -d ' ')
  FILE_KB=$(python3 -c "print(f'{int(\"$FILE_BYTES\") / 1024:.1f}')" 2>/dev/null || echo "?")
  pass "Downloaded ${FILE_BYTES} bytes (${FILE_KB} KB) → $WORK_FILE"
else
  fail "HTTP $HTTP_CODE — download failed for key: $LATEST_KEY"
  OVERALL_PASS=false
fi

# ── Step 4: Validate JSON structure ──────────────────────────────────────────
step 4 "Validating backup JSON structure..."

STRUCT_RESULT=$(python3 - "$WORK_FILE" <<'PYEOF'
import json, sys

path = sys.argv[1]
errors = []
warnings = []

try:
    with open(path) as f:
        backup = json.load(f)
except json.JSONDecodeError as e:
    print(f"INVALID_JSON:{e}")
    sys.exit(1)

# Top-level envelope fields
required_fields = ['version', 'createdAt', 'createdBy', 'type', 'tables', 'data']
for field in required_fields:
    if field not in backup:
        errors.append(f"Missing envelope field: '{field}'")

if errors:
    for e in errors:
        print(f"ERROR:{e}")
    sys.exit(1)

# Version check
version = backup.get('version', '')
if version != '1.0':
    warnings.append(f"Unexpected version '{version}' (expected '1.0')")

# Cross-check tables metadata vs data keys
meta_tables  = set(backup.get('tables', {}).keys())
data_tables  = set(backup.get('data', {}).keys())
tables_count = len(data_tables)

only_in_meta = meta_tables - data_tables
only_in_data = data_tables - meta_tables
if only_in_meta:
    warnings.append(f"Tables in metadata but not in data: {sorted(only_in_meta)}")
if only_in_data:
    warnings.append(f"Tables in data but not in metadata: {sorted(only_in_data)}")

print(f"TABLES:{tables_count}")
print(f"VERSION:{version}")
print(f"TYPE:{backup.get('type','?')}")
print(f"CREATED_AT:{backup.get('createdAt','?')}")

data = backup.get('data', {})
total_rows = 0
for t in sorted(data.keys()):
    rows = len(data[t]) if isinstance(data[t], list) else 0
    total_rows += rows
    print(f"TABLE:{t}:{rows}")

print(f"TOTAL_ROWS:{total_rows}")

for w in warnings:
    print(f"WARN:{w}")

print("OK")
PYEOF
)

STRUCT_EXIT=$?

if echo "$STRUCT_RESULT" | grep -q "^INVALID_JSON:"; then
  fail "File is not valid JSON: $(echo "$STRUCT_RESULT" | grep '^INVALID_JSON:' | cut -d: -f2-)"
  OVERALL_PASS=false
elif [ $STRUCT_EXIT -ne 0 ] || echo "$STRUCT_RESULT" | grep -q "^ERROR:"; then
  fail "Structural validation errors:"
  echo "$STRUCT_RESULT" | grep "^ERROR:" | while read -r line; do
    echo "       ${line#ERROR:}"
  done
  OVERALL_PASS=false
else
  TABLES_COUNT=$(echo "$STRUCT_RESULT" | grep "^TABLES:" | cut -d: -f2)
  TOTAL_ROWS=$(echo "$STRUCT_RESULT"   | grep "^TOTAL_ROWS:" | cut -d: -f2)
  BK_VERSION=$(echo "$STRUCT_RESULT"   | grep "^VERSION:" | cut -d: -f2)
  BK_TYPE=$(echo "$STRUCT_RESULT"      | grep "^TYPE:" | cut -d: -f2)

  pass "Valid JSON envelope — version $BK_VERSION, type '$BK_TYPE'"
  info "$TABLES_COUNT tables exported, $TOTAL_ROWS total rows"

  # Print per-table row counts
  echo ""
  printf "  %-35s %s\n" "Table" "Rows"
  printf "  %-35s %s\n" "─────────────────────────────────" "────"
  echo "$STRUCT_RESULT" | grep "^TABLE:" | while IFS=: read -r _ tname trows; do
    printf "  %-35s %s\n" "$tname" "$trows"
  done

  # Print any warnings
  if echo "$STRUCT_RESULT" | grep -q "^WARN:"; then
    echo ""
    echo "$STRUCT_RESULT" | grep "^WARN:" | while read -r line; do
      warn "${line#WARN:}"
    done
  fi
fi

# ── Step 5: Verify critical tables ───────────────────────────────────────────
step 5 "Checking critical tables are present and non-empty..."

TABLE_CHECK_RESULT=$(python3 - "$WORK_FILE" "${CRITICAL_TABLES[@]}" <<'PYEOF'
import json, sys

path       = sys.argv[1]
to_check   = sys.argv[2:]

with open(path) as f:
    backup = json.load(f)

data = backup.get('data', {})
meta = backup.get('tables', {})

all_pass = True
for table in to_check:
    if table not in data:
        print(f"MISSING:{table}")
        all_pass = False
    else:
        rows_in_data = len(data[table]) if isinstance(data[table], list) else 0
        rows_in_meta = meta.get(table, -1)

        if rows_in_data != rows_in_meta and rows_in_meta != -1:
            print(f"MISMATCH:{table}:data={rows_in_data},meta={rows_in_meta}")
            all_pass = False
        else:
            print(f"OK:{table}:{rows_in_data}")

if all_pass:
    print("ALL_PASS")
else:
    print("SOME_FAIL")
PYEOF
)

TABLE_EXIT=$?
echo ""
printf "  %-35s %-10s %s\n" "Table" "Status" "Rows"
printf "  %-35s %-10s %s\n" "─────────────────────────────────" "──────────" "────"

TABLES_ALL_PASS=true
while IFS= read -r line; do
  case "$line" in
    OK:*)
      IFS=: read -r _ tname trows <<< "$line"
      printf "  %-35s ${GREEN}%-10s${RESET} %s\n" "$tname" "present" "$trows rows"
      ;;
    MISSING:*)
      tname="${line#MISSING:}"
      printf "  %-35s ${RED}%-10s${RESET} %s\n" "$tname" "MISSING" "—"
      TABLES_ALL_PASS=false
      OVERALL_PASS=false
      ;;
    MISMATCH:*)
      IFS=: read -r _ tname detail <<< "$line"
      printf "  %-35s ${YELLOW}%-10s${RESET} %s\n" "$tname" "MISMATCH" "$detail"
      TABLES_ALL_PASS=false
      OVERALL_PASS=false
      ;;
  esac
done <<< "$TABLE_CHECK_RESULT"

echo ""
if [ "$TABLES_ALL_PASS" = true ]; then
  pass "All ${#CRITICAL_TABLES[@]} critical tables verified — row counts match metadata"
else
  fail "One or more critical tables failed verification"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
if [ "$OVERALL_PASS" = true ]; then
  echo -e "${GREEN}${BOLD}  BACKUP VERIFICATION: PASSED${RESET}"
  echo -e "  All checks completed successfully."
  exit 0
else
  echo -e "${RED}${BOLD}  BACKUP VERIFICATION: FAILED${RESET}"
  echo -e "  One or more checks did not pass. Review output above."
  exit 1
fi
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
echo ""
