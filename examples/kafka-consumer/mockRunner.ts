/**
 * Offline demo — no Kafka broker required.
 * Feeds fake messages through the same handleMessage wrapper you'd use with kafkajs.
 *
 * Real broker later (sketch):
 *   consumer.run({
 *     eachMessage: async ({ topic, partition, message }) => {
 *       await handleMessage({
 *         topic,
 *         offset: message.offset,
 *         value: message.value?.toString() ?? '',
 *       });
 *     },
 *   });
 */
import { handleMessage } from './consumer.js';

const messages = [
  { topic: 'demo.jobs', offset: '100', value: '{"job":"enrich-plot","id":1}' },
  { topic: 'demo.jobs', offset: '101', value: '{"job":"enrich-plot","id":2}' },
  { topic: 'demo.jobs', offset: '102', value: '{"job":"enrich-plot","id":3}' },
];

async function main() {
  console.error('kafka-consumer mockRunner — processing fake messages');
  console.error('Tip: start express-api in another terminal to see cross-service headers\n');

  for (const msg of messages) {
    await handleMessage(msg);
  }

  console.error('\ndone — grep logs by a taskContextId (taskId-...) to see one message end-to-end');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
