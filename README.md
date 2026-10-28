# CorrelationIds demo

Teaching demos for **CorrelationIds** — attaching request/task context to every log line so concurrent traffic is filterable in stdout, CloudWatch, or any log aggregator.

Runnable Express + Kafka-style examples. No cloud accounts, OAuth, or brokers required for the default demos.

## Concepts

| Field | When | Header / log key |
|-------|------|------------------|
| `requestId` | Each HTTP request | Response `request_id` / log `requestId` |
| `taskContextId` | Each Kafka message (and forwarded into APIs) | Header `taskcontextid` / log `taskContextId` |

Node **`AsyncLocalStorage`** holds the store for the async call chain. A central logger reads it on every line — you do not pass IDs through every function.

## Setup

```bash
npm install
```

## Examples

### 1. Express API

```bash
npm run express
# other terminal:
npm run demo:curl
```

- Middleware creates `requestId`, optionally accepts inbound `taskcontextid`
- Parallel curls interleave log lines; filter by `request_id` from the response header
- **Addon:** response headers (`request_id`, `taskContextId`) + optional JSON `correlation` so callers can paste ids into support tickets

### Addon — give callers ticket context

Echoing correlation ids on the **response** turns internal log keys into something the caller can hand back:

| Channel | What | Why |
|---------|------|-----|
| Response headers | `request_id`, `taskContextId` | Works for curl, gateways, non-UI clients |
| `Access-Control-Expose-Headers` | same names | Lets browser JS read those headers |
| Optional JSON body | `correlation: { requestId, taskContextId? }` | Easy copy/paste in UI error toasts |

`npm run demo:curl` ends with a “paste into ticket” block.

### 2. Kafka consumer (offline mock)

```bash
npm run kafka:mock
```

- Same ALS wrap as a typical `eachMessage` handler
- No broker; fake messages only
- If Express is also running, each message calls `/work` with `taskcontextid`

### 3. Cross-service hop

```bash
# terminal A
npm run express
# terminal B
npm run cross-service
```

One `taskContextId` appears in both consumer and API logs; the API hop also gets its own `requestId`.

## Layout

```
shared/                     # ALS + JSON logger
examples/express-api/       # middleware + curl demo
examples/kafka-consumer/    # eachMessage-style wrap + mock runner
examples/cross-service/     # hop narration + runner
```

## Modeling after this in a real service

1. Create ALS store + `run` / `getStore` helpers  
2. At every **entry boundary** (Express middleware, Kafka `eachMessage`), create or accept ids and `run(...)`  
3. Make the logger append store fields automatically  
4. On outbound HTTP, forward `taskcontextid` / `request_id` from the store  
5. **Addon:** set the same ids on response headers (expose them for browsers) so ticket submitters can include them  

## License

MIT
