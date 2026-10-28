/**
 * Cross-service hop demo
 *
 * Kafka-style boundary creates taskContextId → outbound header taskcontextid
 * → three sequential HTTP calls → Express creates a new requestId for each,
 * while all requests and both log streams share the same taskContextId.
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
  console.error('2) makes three sequential /work requests with the same taskcontextid header');
  console.error('3) express creates a different requestId for every request');
  console.error('4) compare downstreamRequestId in the consumer logs; taskContextId stays the same\n');

  await handleMessage(
    {
      topic: 'demo.jobs',
      offset: '999',
      value: '{"job":"cross-service-demo"}',
    },
    Array.from({ length: 3 }, () => `${base}/work`),
  );

  console.error('\nFilter by taskContextId to follow all three requests across both processes.');
  console.error('Filter API logs by one requestId to see only that individual HTTP request.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
