/**
 * Before CorrelationIds — same multi-step /work handler, but no request context.
 *
 * Fire parallel curls and watch the terminal: identical log lines from different
 * requests interleave with no id to filter on. Contrast with server.ts.
 */
import express from 'express';

const PORT = Number(process.env.PORT ?? 4091);

const app = express();
app.use(express.json());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function log(message: string, extra: Record<string, unknown> = {}) {
  // Intentionally no requestId / taskContextId
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...extra,
    }),
  );
}

app.get('/work', async (_req, res) => {
  log('work started');
  await sleep(80 + Math.random() * 120);
  log('work mid-step', { step: 'validate' });
  await sleep(80 + Math.random() * 120);
  log('work mid-step', { step: 'persist' });
  await sleep(80 + Math.random() * 120);
  log('work finished');
  res.json({
    ok: true,
    message: 'No correlation ids — try filtering these logs by request. You cannot.',
  });
});

app.get('/ping', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.error(`express-api (NO correlation) on http://localhost:${PORT}`);
  console.error('Try: npm run demo:curl:chaos');
  console.error('Then compare with: npm run express && npm run demo:curl');
});
