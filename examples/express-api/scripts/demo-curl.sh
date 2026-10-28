#!/usr/bin/env bash
# Fire concurrent requests so logs interleave, then show how to filter by request_id.
# Also demos returning correlation ids to the caller for ticket troubleshooting.
set -euo pipefail

BASE="${BASE_URL:-http://localhost:4090}"

echo "== ping =="
curl -sS "$BASE/ping"
echo
echo

echo "== parallel /work (watch the server terminal — lines interleave) =="
TMP=$(mktemp -d)
for i in 1 2 3 4; do
  (
    headers=$(curl -sS -D - -o /dev/null "$BASE/work")
    request_id=$(echo "$headers" | awk -F': ' 'tolower($1)=="request_id"{print $2}' | tr -d '\r')
    echo "request $i → request_id=$request_id"
    echo "$request_id" > "$TMP/r$i"
  ) &
done
wait

echo
echo "== pick one id and filter server logs (example) =="
SAMPLE=$(head -1 "$TMP/r1")
echo "  grep '$SAMPLE'   # or CloudWatch filter: requestId = \"$SAMPLE\""
echo
echo "== inbound taskContextId propagation =="
curl -sS -D - -o /dev/null \
  -H "taskcontextid: taskId-demo-from-kafka" \
  -H "user-id: sean" \
  "$BASE/work" | grep -iE 'request_id|taskcontextid|HTTP/'
echo
echo "Server logs for that call should include both requestId and taskContextId=taskId-demo-from-kafka"
echo
echo "== addon: capture ids for a support ticket =="
# -i shows headers; body also echoes correlation for UI-friendly copy/paste
RESP=$(curl -sS -i \
  -H "taskcontextid: taskId-ticket-demo" \
  "$BASE/work")
echo "$RESP" | grep -iE '^(HTTP/|request_id:|taskcontextid:|\{)'
REQUEST_ID=$(echo "$RESP" | awk -F': ' 'tolower($1)=="request_id"{print $2}' | tr -d '\r' | head -1)
TASK_ID=$(echo "$RESP" | awk -F': ' 'tolower($1)=="taskcontextid"{print $2}' | tr -d '\r' | head -1)
echo
echo "--- paste into ticket ---"
echo "request_id:     $REQUEST_ID"
echo "taskContextId:  $TASK_ID"
echo "Support can filter CloudWatch / logs on either id."

rm -rf "$TMP"
