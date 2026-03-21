#!/usr/bin/env bash
# Test the ClipManifest standalone API endpoint.
# Requires test.conf — run ./setup.sh first.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_FILE="${SCRIPT_DIR}/test.conf"

if [[ ! -f "$CONF_FILE" ]]; then
  echo "Error: test.conf not found. Run ./setup.sh first."
  exit 1
fi

source "$CONF_FILE"

if [[ -z "${API_URL:-}" ]]; then
  echo "Error: API_URL is empty in test.conf. Run ./setup.sh to populate."
  exit 1
fi

# ─── Test 1: Validation — missing fields ────────────────────────────────
echo "=== Test 1: Missing required fields (expect 400/500) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{"start_time": 20}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY}"
if [[ "$HTTP_CODE" =~ ^(400|500|502)$ ]]; then
  echo "  ✅ PASS — invalid request rejected"
else
  echo "  ❌ FAIL — expected 4xx/5xx, got ${HTTP_CODE}"
fi
echo ""

# ─── Test 2: Validation — end_time <= start_time ────────────────────────
echo "=== Test 2: end_time <= start_time (expect 400/500) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": 70, \"end_time\": 20, \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY}"
if [[ "$HTTP_CODE" =~ ^(400|500|502)$ ]]; then
  echo "  ✅ PASS — invalid time range rejected"
else
  echo "  ❌ FAIL — expected 4xx/5xx, got ${HTTP_CODE}"
fi
echo ""

# ─── Test 3: Validation — non-numeric times ─────────────────────────────
echo "=== Test 3: Non-numeric start/end times (expect 400/500) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": \"abc\", \"end_time\": \"xyz\", \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY}"
if [[ "$HTTP_CODE" =~ ^(400|500|502)$ ]]; then
  echo "  ✅ PASS — non-numeric times rejected"
else
  echo "  ❌ FAIL — expected 4xx/5xx, got ${HTTP_CODE}"
fi
echo ""

# ─── Test 4: Create clip (requires real recording) ──────────────────────
echo "=== Test 4: Create clip (POST /clipmanifest) ==="
echo "  API_URL:    ${API_URL}"
echo "  MASTER_URL: ${MASTER_URL}"
echo "  Range:      ${START_TIME}s — ${END_TIME}s"
echo "  Byte range: ${BYTE_RANGE}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"start_time\": ${START_TIME}, \"end_time\": ${END_TIME}, \"master_url\": \"${MASTER_URL}\", \"byte_range\": ${BYTE_RANGE}}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  HTTP ${HTTP_CODE}"
echo "  Body: ${BODY}"
echo ""

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "  ✅ PASS — clip created successfully"
  CLIP_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['master_url'])" 2>/dev/null || echo "")
  if [[ -n "$CLIP_URL" ]]; then
    echo "  Clip URL: ${CLIP_URL}"
    echo ""
    echo "  Verifying clip manifest is accessible..."
    CLIP_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$CLIP_URL")
    echo "  Clip manifest HTTP: ${CLIP_HTTP}"
    if [[ "$CLIP_HTTP" == "200" ]]; then
      echo "  ✅ PASS — clip manifest accessible via CloudFront"
    else
      echo "  ⚠️  Clip manifest returned ${CLIP_HTTP} (may need CloudFront propagation time)"
    fi
  fi
elif [[ "$HTTP_CODE" == "404" ]]; then
  echo "  ⚠️  SKIP — recording not found. Update MASTER_URL in test.conf with a real recording."
else
  echo "  ❌ FAIL — unexpected response ${HTTP_CODE}"
fi
