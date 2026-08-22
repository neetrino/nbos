import { describe, expect, it } from 'vitest';
import {
  clearClickToCallIdempotencyKey,
  CLICK_TO_CALL_NEW_CALL_WARNING,
  nextClickToCallIdempotencyKey,
  requestNewClickToCallKey,
  shouldKeepClickToCallIdempotencyKey,
} from './click-to-call-idempotency-key';

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    data,
  };
}

describe('click-to-call idempotency key', () => {
  it('reuses the stored key for retries of the same action', () => {
    const store = memoryStore();
    const first = nextClickToCallIdempotencyKey(store, 'LEAD', 'lead-1', () => 'uuid-1');
    const retry = nextClickToCallIdempotencyKey(store, 'LEAD', 'lead-1', () => 'uuid-2');
    expect(first).toBe('uuid-1');
    expect(retry).toBe('uuid-1');
  });

  it('creates a new key after a completed action is cleared', () => {
    const store = memoryStore();
    nextClickToCallIdempotencyKey(store, 'LEAD', 'lead-1', () => 'uuid-1');
    clearClickToCallIdempotencyKey(store, 'LEAD', 'lead-1');
    const next = nextClickToCallIdempotencyKey(store, 'LEAD', 'lead-1', () => 'uuid-2');
    expect(next).toBe('uuid-2');
  });

  it('keeps the key for in-progress, network, and ambiguous 5xx', () => {
    expect(shouldKeepClickToCallIdempotencyKey(202)).toBe(true);
    expect(shouldKeepClickToCallIdempotencyKey(undefined)).toBe(true);
    expect(shouldKeepClickToCallIdempotencyKey(500)).toBe(true);
    expect(shouldKeepClickToCallIdempotencyKey(503)).toBe(true);
    expect(shouldKeepClickToCallIdempotencyKey(502)).toBe(true);
    expect(shouldKeepClickToCallIdempotencyKey(409)).toBe(false);
    expect(shouldKeepClickToCallIdempotencyKey(400)).toBe(false);
  });

  it('clears the stored key only after the user confirms a new call', () => {
    const store = memoryStore();
    nextClickToCallIdempotencyKey(store, 'LEAD', 'lead-1', () => 'uuid-1');
    expect(requestNewClickToCallKey(store, 'LEAD', 'lead-1', () => false)).toBe(false);
    expect(store.getItem('nbos.click-to-call:LEAD:lead-1')).toBe('uuid-1');
    expect(
      requestNewClickToCallKey(store, 'LEAD', 'lead-1', (message) => {
        expect(message).toBe(CLICK_TO_CALL_NEW_CALL_WARNING);
        return true;
      }),
    ).toBe(true);
    expect(store.getItem('nbos.click-to-call:LEAD:lead-1')).toBeNull();
  });
});
