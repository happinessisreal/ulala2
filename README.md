# Local Observability Demo

This repo spins up a lightweight observability stack for a local Dockerized web service:

- Prometheus for scraping metrics and evaluating alerts
- Node Exporter for host CPU/memory metrics
- Grafana for dashboards
- Demo app exposing `/metrics` (mock values) and `/health`

What you get:
- Monitors a local web service running in Docker
- Collects CPU, memory, and response time metrics
- Visualizes metrics in Grafana
- Triggers alerts for app availability and CPU > 70%

Contents
- `docker-compose.yml` — defines services: `app`, `prometheus`, `node-exporter`, `grafana`
- `prometheus.yml` — scrape config and rule file reference
- `alert.rules.yml` — CPU usage and app availability alerts
- `grafana-dashboard.json` — a basic dashboard to import into Grafana
- `app/` — simple Node.js service exposing `/metrics`
- `alert_dispatcher.sh` — polls Prometheus Alerts API and logs locally (bonus)
- `screenshots/` — drop your Grafana screenshot here (see below)

Prerequisites
- Docker with Compose plugin

Quick start
```bash
docker compose up -d --build

# App: http://localhost:8000
curl -s http://localhost:8000/health

# Prometheus: http://localhost:9090
# Node Exporter: http://localhost:9100/metrics
# Grafana: http://localhost:3000  (user: admin / pass: admin)
```

Grafana dashboard
1) Open Grafana at `http://localhost:3000` and log in (admin/admin).
2) Add a Prometheus data source pointing to `http://prometheus:9090` (inside Docker network) or `http://localhost:9090` (from host).
3) Import `grafana-dashboard.json` (Dashboards → Import) and pick your Prometheus data source.

Trigger some traffic and alerts
- Generate app traffic for latency metrics:
```bash
for i in {1..200}; do curl -s http://localhost:8000/ >/dev/null; done
```

- Simulate an unhealthy app (toggles a custom `app_up` metric):
```bash
curl "http://localhost:8000/toggle_health?state=0"  # unhealthy
sleep 70  # AppDown alert has for: 1m
curl "http://localhost:8000/toggle_health?state=1"  # healthy
```

- Drive CPU > 70% (example for Linux/macOS shells):
```bash
# one-liner CPU burner (Ctrl+C to stop)
sh -c 'while :; do :; done' &
sh -c 'while :; do :; done' &
# wait a couple minutes to satisfy the alert for duration, then kill the background jobs
kill %1 %2 || true
```
Note: CPU is measured from Node Exporter; you can also use your preferred stress tool.

Bonus: alert dispatcher
```bash
chmod +x ./alert_dispatcher.sh
./alert_dispatcher.sh  # polls http://localhost:9090/api/v1/alerts every 15s

# Customize via env vars:
PROMETHEUS_URL=http://localhost:9090 INTERVAL_SECONDS=10 LOG_DIR=./logs ./alert_dispatcher.sh
```
Logs will be written to `logs/alerts.log`. If you have `jq` installed, the output is compact and readable; otherwise raw JSON is logged.

Screenshot (MUST)
- After metrics are flowing and you’ve imported the dashboard, take a screenshot showing panels and a sample alert firing.
- Save it to `screenshots/grafana-dashboard.png` in this repo.

Teardown
```bash
docker compose down -v
```
