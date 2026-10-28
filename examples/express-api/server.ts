/**
 * Express CorrelationId demo
 *
 * Pattern:
 *  1. Middleware creates requestId, reads inbound taskcontextid
 *  2. AsyncLocalStorage.run keeps that store for the whole request
 *  3. Logger reads the store — no ID threading through every function
 *  4. Addon: echo ids on response headers (and optionally body) so callers
 *     can paste them into support tickets for log lookup
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLocalStore, runWithStore } from '../../shared/asyncLocalStorage.js';
import logger from '../../shared/logger.js';

const PORT = Number(process.env.PORT ?? 4090);

const app = express();
app.use(express.json());

// --- CorrelationId middleware ------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = `reqid-${uuidv4()}`;
  const taskContextId = req.headers['taskcontextid']
    ? String(req.headers['taskcontextid'])
    : undefined;
  const userId = req.headers['user-id'] ? String(req.headers['user-id']) : 'anonymous';

  // Addon: return ids to the caller for troubleshooting / ticket context
  res.set('request_id', requestId);
  if (taskContextId) {
    res.set('taskContextId', taskContextId);
  }
  // Browser fetch/XHR only expose "simple" headers unless listed here
  res.set('Access-Control-Expose-Headers', 'request_id, taskContextId');

  runWithStore({ requestId, taskContextId, userId }, () => next());
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function correlationForCaller() {
  const { requestId, taskContextId } = getLocalStore();
  return {
    requestId,
    ...(taskContextId ? { taskContextId } : {}),
  };
}

// Multi-step handler: concurrent curls interleave without a filter
app.get('/work', async (_req, res) => {
  logger.info('work started');
  await sleep(80 + Math.random() * 120);
  logger.info('work mid-step', { step: 'validate' });
  await sleep(80 + Math.random() * 120);
  logger.info('work mid-step', { step: 'persist' });
  await sleep(80 + Math.random() * 120);
  logger.info('work finished');
  // Headers already carry the ids; body echo is optional UX for UI/clients
  res.json({
    ok: true,
    message: 'Include requestId (and taskContextId if present) when opening a ticket',
    correlation: correlationForCaller(),
  });
});

app.get('/ping', (_req, res) => {
  res.json({ ok: true, correlation: correlationForCaller() });
});

app.listen(PORT, () => {
  console.error(`express-api listening on http://localhost:${PORT}`);
  console.error('Try: npm run demo:curl');
});
