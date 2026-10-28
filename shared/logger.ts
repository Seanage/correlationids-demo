import { getLocalStore } from './asyncLocalStorage.js';

type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, message: string, extra: Record<string, unknown> = {}) {
  const { requestId, taskContextId, userId } = getLocalStore();

  // Structured JSON → easy to filter in log aggregators / local greps
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId,
      taskContextId,
      userId,
      ...extra,
    }),
  );
}

const logger = {
  info: (message: string, extra?: Record<string, unknown>) => log('info', message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => log('warn', message, extra),
  error: (message: string, extra?: Record<string, unknown>) => log('error', message, extra),
  debug: (message: string, extra?: Record<string, unknown>) => log('debug', message, extra),
};

export default logger;
