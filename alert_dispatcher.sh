#!/usr/bin/env bash
set -euo pipefail

# Simple alert poller that fetches active alerts from Prometheus
# and appends them to logs/alerts.log. If jq is present, pretty-print.

PROM_URL="${PROMETHEUS_URL:-http://localhost:9090}"
INTERVAL="${INTERVAL_SECONDS:-15}"
LOG_DIR="${LOG_DIR:-./logs}"
LOG_FILE="$LOG_DIR/alerts.log"

mkdir -p "$LOG_DIR"

echo "[alert-dispatcher] polling $PROM_URL every ${INTERVAL}s; logging to $LOG_FILE" >&2

while true; do
  ts=$(date -Iseconds)
  resp=$(curl -sS "$PROM_URL/api/v1/alerts" || true)

  if command -v jq >/dev/null 2>&1; then
    firing=$(echo "$resp" | jq '.data.alerts | map(select(.state=="firing"))')
    if [ "$(echo "$firing" | jq 'length')" -gt 0 ]; then
      echo "[$ts] firing alerts:" | tee -a "$LOG_FILE"
      echo "$firing" | jq -c '.[] | {labels: .labels, annotations: .annotations, activeAt: .activeAt}' | tee -a "$LOG_FILE"
    else
      echo "[$ts] no firing alerts" | tee -a "$LOG_FILE"
    fi
  else
    # Fallback: write raw JSON
    echo "[$ts] alerts raw: $resp" | tee -a "$LOG_FILE"
  fi

  sleep "$INTERVAL"
done
