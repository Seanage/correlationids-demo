#!/usr/bin/env bash
# Concurrent requests against the NO-correlation server — logs interleave with no filter key.
set -euo pipefail

BASE="${BASE_URL:-http://localhost:4091}"

echo "== ping =="
curl -sS "$BASE/ping"
echo
echo

echo "== parallel /work (watch the server terminal) =="
echo "Lines from different requests look the same — no requestId to grep."
echo

for i in 1 2 3 4; do
  curl -sS "$BASE/work" > /dev/null &
done
wait

echo
echo "Done. On the server: identical 'work started/mid-step/finished' lines, interleaved."
echo "Next: stop this server, run npm run express + npm run demo:curl — same traffic, filterable."
