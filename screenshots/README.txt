Place a screenshot of Grafana showing the dashboard and a sample alert trigger here as grafana-dashboard.png.

Suggested steps:
1) Bring stack up: docker compose up -d --build
2) Import grafana-dashboard.json and select Prometheus datasource
3) Drive load: for i in {1..200}; do curl -s http://localhost:8000/ >/dev/null; done
4) Trigger alert:
   - AppDown: curl "http://localhost:8000/toggle_health?state=0" and wait >1m
   - HighCPUUsage: run two tight while-loops for ~2 minutes
5) Take screenshot and save as screenshots/grafana-dashboard.png
