import {
  NOTIFICATION_REFETCH_DEBOUNCE_MS,
  type NotificationRefetchKey,
} from './notification-realtime.constants';

type RefetchHandler = () => void | Promise<void>;

/**
 * Debounced + in-flight-deduped refresh registry (Ommm pattern).
 * Focus / visibility / reconnect / SSE invalidate all go through here.
 */
export class NotificationRefetchRegistry {
  private readonly handlers = new Map<NotificationRefetchKey, Set<RefetchHandler>>();
  private readonly inFlight = new Map<NotificationRefetchKey, Promise<void>>();
  private readonly debounceTimers = new Map<
    NotificationRefetchKey,
    ReturnType<typeof setTimeout>
  >();

  register(key: NotificationRefetchKey, handler: RefetchHandler): () => void {
    const bucket = this.handlers.get(key) ?? new Set<RefetchHandler>();
    bucket.add(handler);
    this.handlers.set(key, bucket);
    return () => {
      bucket.delete(handler);
      if (bucket.size === 0) {
        this.handlers.delete(key);
      }
    };
  }

  request(keys: readonly NotificationRefetchKey[], force = false): void {
    for (const key of [...new Set(keys)]) {
      if (force) {
        this.clearDebounce(key);
        void this.runKey(key);
        continue;
      }
      this.scheduleDebounced(key);
    }
  }

  private scheduleDebounced(key: NotificationRefetchKey): void {
    const existing = this.debounceTimers.get(key);
    if (existing !== undefined) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      void this.runKey(key);
    }, NOTIFICATION_REFETCH_DEBOUNCE_MS);
    this.debounceTimers.set(key, timer);
  }

  private clearDebounce(key: NotificationRefetchKey): void {
    const timer = this.debounceTimers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }

  private async runKey(key: NotificationRefetchKey): Promise<void> {
    const pending = this.inFlight.get(key);
    if (pending !== undefined) {
      await pending;
      return;
    }
    const bucket = this.handlers.get(key);
    if (!bucket || bucket.size === 0) return;

    const run = (async () => {
      await Promise.all([...bucket].map((handler) => Promise.resolve(handler())));
    })();
    this.inFlight.set(key, run);
    try {
      await run;
    } finally {
      this.inFlight.delete(key);
    }
  }
}
