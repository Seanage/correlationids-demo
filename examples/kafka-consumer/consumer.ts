/**
 * Crude Kafka-consumer CorrelationId pattern (eachMessage-style wrap)
 *
 * At the message boundary:
 *   taskContextId = taskId-{uuid}
 *   asyncLocalStorage.run({ taskContextId }, handle)
 *
 * Every log inside handle() gets taskContextId with no manual threading.
 * Outbound HTTP should forward header taskcontextid (see callDownstream).
 */
import { v4 as uuidv4 } from 'uuid';
import { runWithStore, getLocalStore } from '../../shared/asyncLocalStorage.js';
import logger from '../../shared/logger.js';

export type FakeKafkaMessage = {
  topic: string;
  offset: string;
  value: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What you'd put around kafkajs eachMessage */
export async function handleMessage(
  message: FakeKafkaMessage,
  downstreamUrls: string[] = ['http://localhost:4090/work'],
): Promise<void> {
  const taskContextId = `taskId-${uuidv4()}`;

  return runWithStore({ taskContextId }, async () => {
    logger.info('kafka message started', {
      topic: message.topic,
      offset: message.offset,
    });

    await sleep(50);
    logger.info('kafka message processing', { payload: message.value });

    // Keep every call inside the same task context. Each HTTP request gets
    // its own requestId at the API boundary, but shares this taskContextId.
    for (const [index, url] of downstreamUrls.entries()) {
      logger.info('downstream request started', {
        requestNumber: index + 1,
        totalRequests: downstreamUrls.length,
      });
      await callDownstream(url);
    }

    logger.info('kafka message finished', { topic: message.topic });
  });
}

/**
 * Outbound call: pull taskContextId from ALS → header.
 * Uses fetch so we don't need axios for the teaching demo.
 */
export async function callDownstream(url: string): Promise<void> {
  const { taskContextId } = getLocalStore();

  logger.info('calling downstream API', { url, taskcontextid: taskContextId });

  try {
    const res = await fetch(url, {
      headers: {
        taskcontextid: taskContextId ?? '',
        'user-id': 'kafka-consumer',
      },
    });
    const requestId = res.headers.get('request_id');
    logger.info('downstream responded', {
      status: res.status,
      downstreamRequestId: requestId,
    });
  } catch (err) {
    logger.warn('downstream call failed (is express-api running?)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
