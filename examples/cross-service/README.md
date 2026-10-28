# Cross-service hop

Shows one originating action across two processes:

1. Kafka-style consumer creates `taskContextId` (`taskId-…`)
2. Outbound HTTP sends header `taskcontextid`
3. Express middleware keeps that id **and** creates a new `requestId`
4. Filter either log stream by `taskContextId` to follow the hop

## Run

Terminal A:

```bash
npm run express
```

Terminal B:

```bash
npm run cross-service
```

Look for the same `taskContextId` in both terminals; the Express side also has a unique `requestId` for that HTTP hop.
