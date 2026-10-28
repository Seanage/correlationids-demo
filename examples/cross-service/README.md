# Cross-service hop

Shows one originating action making **three sequential HTTP requests** across two processes:

1. Kafka-style consumer creates `taskContextId` (`taskId-…`)
2. Each outbound `/work` request sends the **same** `taskcontextid` header
3. Express middleware keeps that id **and** creates a **new `requestId` for every request**
4. Consumer logs each response's `request_id` header as `downstreamRequestId`
5. Filter by `taskContextId` for the whole action, or by `requestId` for one HTTP request

## Run

Terminal A:

```bash
npm run express
```

Terminal B:

```bash
npm run cross-service
```

## What to look for

The consumer logs `downstream request started` with `requestNumber` 1, 2, and 3.
Each is followed by `downstream responded`, showing a different `downstreamRequestId`
but the same `taskContextId`. For example (IDs shortened for illustration):

| Request | `taskContextId` (both processes) | `downstreamRequestId` (consumer) / `requestId` (API) |
|---------|--------------------------------|-------------------------------------------------------------------|
| 1 | `taskId-aaa` | `reqid-111` |
| 2 | `taskId-aaa` | `reqid-222` |
| 3 | `taskId-aaa` | `reqid-333` |

In the Express terminal, all `work started`, `work mid-step`, and `work finished`
logs for a single request have the same `requestId`. The next request gets a new
`requestId`, while `taskContextId` stays unchanged across all three requests.

Running the demo again creates a new `taskContextId` and three new request IDs.
The initial `/ping` readiness check is separate and does not carry the task context.

The API defaults to `http://localhost:4090`. If it runs elsewhere, set `BASE_URL`
for the cross-service runner; both the readiness check and work requests use it.
