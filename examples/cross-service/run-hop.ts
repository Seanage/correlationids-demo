/**
 * Cross-service hop demo
 *
 * Kafka-style boundary creates taskContextId → outbound header taskcontextid
 * → Express middleware stores it alongside a new requestId → both log streams share the task id.
 *
 * Requires express-api on PORT (default 4090).
 */
import { handleMessage } from '../kafka-consumer/consumer.js';

async function waitForExpress(url: string, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`express-api not reachable at ${url} — run: npm run express`);
}

async function main() {
  const base = process.env.BASE_URL ?? 'http://localhost:4090';
  await waitForExpress(`${base}/ping`);

  console.error('=== cross-service hop ===');
  console.error('1) consumer creates taskContextId');
  console.error('2) forwards taskcontextid header to express-api');
  console.error('3) express adds its own requestId; both appear on API logs\n');

  await handleMessage({
    topic: 'demo.jobs',
    offset: '999',
    value: '{"job":"cross-service-demo"}',
  });

  console.error('\nFilter either process log stream by the same taskContextId to follow one action.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
