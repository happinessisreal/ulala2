import express from 'express';
import client from 'prom-client';

const app = express();
const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

const appUp = new client.Gauge({
  name: 'app_up',
  help: '1 if app is reporting healthy, 0 otherwise'
});

registry.registerMetric(httpRequestDurationSeconds);
registry.registerMetric(appUp);

let healthy = true;
appUp.set(1);

// basic request timing middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const diffNs = Number(process.hrtime.bigint() - start);
    const seconds = diffNs / 1e9;
    httpRequestDurationSeconds
      .labels(req.method, req.route?.path || req.path, `${res.statusCode}`)
      .observe(seconds);
  });
  next();
});

app.get('/', async (_req, res) => {
  // Simulate variable latency 10-300ms
  const ms = Math.floor(10 + Math.random() * 290);
  await new Promise(r => setTimeout(r, ms));
  res.json({ message: 'Hello from demo app', latency_ms: ms });
});

app.get('/health', (_req, res) => {
  if (healthy) {
    return res.status(200).json({ status: 'ok' });
  }
  return res.status(503).json({ status: 'unhealthy' });
});

// Toggle health: /toggle_health?state=0|1
app.get('/toggle_health', (req, res) => {
  const state = req.query.state === '0' ? 0 : 1;
  healthy = state === 1;
  appUp.set(state);
  res.json({ app_up: state });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

const port = process.env.PORT || 8000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Demo app listening on :${port}`);
});
