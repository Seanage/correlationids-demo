import { AsyncLocalStorage } from 'node:async_hooks';

export type CorrelationStore = {
  requestId?: string;
  taskContextId?: string;
  userId?: string;
};

export const asyncLocalStorage = new AsyncLocalStorage<CorrelationStore>();

export function getLocalStore(): CorrelationStore {
  return asyncLocalStorage.getStore() ?? {};
}

export function runWithStore<T>(store: CorrelationStore, fn: () => T): T {
  return asyncLocalStorage.run(store, fn);
}
