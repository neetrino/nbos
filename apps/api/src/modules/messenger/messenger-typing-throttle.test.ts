import { describe, it, expect, beforeEach } from 'vitest';
import { MessengerTypingThrottle } from './messenger-typing-throttle';
import { MESSENGER_TYPING_EMIT_MIN_MS } from '@nbos/shared';

describe('MessengerTypingThrottle', () => {
  let throttle: MessengerTypingThrottle;

  beforeEach(() => {
    throttle = new MessengerTypingThrottle();
  });

  it('allows first emit then blocks within window', () => {
    const t0 = 1_000_000;
    expect(throttle.allow('sock-a', t0)).toBe(true);
    expect(throttle.allow('sock-a', t0 + 500)).toBe(false);
    expect(throttle.allow('sock-a', t0 + MESSENGER_TYPING_EMIT_MIN_MS)).toBe(true);
  });

  it('tracks sockets independently', () => {
    const t0 = 2_000_000;
    expect(throttle.allow('sock-a', t0)).toBe(true);
    expect(throttle.allow('sock-b', t0 + 100)).toBe(true);
  });
});
