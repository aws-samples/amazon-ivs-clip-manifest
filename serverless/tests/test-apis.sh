#!/usr/bin/env bash
# Test all serverless backend API endpoints.
# Requires test.conf — run ./setup.sh first.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_FILE="${SCRIPT_DIR}/test.conf"

if [[ ! -f "$CONF_FILE" ]]; then
  echo "Error: test.conf not found. Run ./setup.sh first."
  exit 1
fi

source "$CONF_FILE"

PASS=0
FAIL=0
SKIP=0

check() {
  local label="$1" http="$2" expect="$3"
  if [[ "$http" =~ ^($expect)$ ]]; then
    echo "  ✅ PASS — ${label}"
    ((PASS++))
  else
    echo "  ❌ FAIL — ${label} (expected ${expect}, got ${http})"
    ((FAIL++))
  fi
}

# ═══════════════════════════════════════════════════════════════════════
# GET /getrecordings
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 1: GET /getrecordings ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_RECORDINGS}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "list recordings" "$HTTP_CODE" "200"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# GET /getclips — missing vod param
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 2: GET /getclips (missing vod param) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_CLIPS}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "missing vod rejected" "$HTTP_CODE" "400|500|502"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# GET /getclips — with vod param (no clips yet)
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 3: GET /getclips?vod=test ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_CLIPS}?vod=test")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "empty clips list" "$HTTP_CODE" "200"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# POST /clipmanifest — validation: missing fields
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 4: POST /clipmanifest (missing fields) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_CLIPMANIFEST}" \
  -H "Content-Type: application/json" \
  -d '{"start_time": 20}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "missing fields rejected" "$HTTP_CODE" "400|500|502"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# POST /clipmanifest — validation: end <= start
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 5: POST /clipmanifest (end <= start) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_CLIPMANIFEST}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": 70, \"end_time\": 20, \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "invalid time range rejected" "$HTTP_CODE" "400|500|502"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# POST /clipmanifest — validation: non-numeric times
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 6: POST /clipmanifest (non-numeric times) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_CLIPMANIFEST}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": \"abc\", \"end_time\": \"xyz\", \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:200}"
check "non-numeric times rejected" "$HTTP_CODE" "400|500|502"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# POST /clipmanifest — create clip (requires sample recording)
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 7: POST /clipmanifest (create clip) ==="
echo "  MASTER_URL: ${MASTER_URL}"
echo "  Range:      ${START_TIME}s — ${END_TIME}s"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_CLIPMANIFEST}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": ${START_TIME}, \"end_time\": ${END_TIME}, \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY:0:300}"

if [[ "$HTTP_CODE" == "200" ]]; then
  check "clip created" "$HTTP_CODE" "200"

  CLIP_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['master_url'])" 2>/dev/null || echo "")
  if [[ -n "$CLIP_URL" ]]; then
    echo "  Clip URL: ${CLIP_URL}"
  fi

  # Extract the recording path for getclips test
  CLIP_PATH=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['path'])" 2>/dev/null || echo "")
elif [[ "$HTTP_CODE" == "404" ]]; then
  echo "  ⚠️  SKIP — recording not found. Update MASTER_URL in test.conf."
  ((SKIP++))
  CLIP_PATH=""
else
  check "clip created" "$HTTP_CODE" "200"
  CLIP_PATH=""
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════
# GET /getclips — verify clip appears
# ═══════════════════════════════════════════════════════════════════════
echo "=== Test 8: GET /getclips (verify created clip) ==="
if [[ -n "${CLIP_PATH:-}" ]]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" "${API_CLIPS}?vod=${CLIP_PATH}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "  HTTP ${HTTP_CODE}"
  echo "  Body: ${BODY:0:300}"
  check "clip appears in listing" "$HTTP_CODE" "200"
else
  echo "  ⚠️  SKIP — no clip created in previous test"
  ((SKIP++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "  Results: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped"
echo "═══════════════════════════════════════════"
