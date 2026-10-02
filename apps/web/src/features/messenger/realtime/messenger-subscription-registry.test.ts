import { describe, expect, it } from 'vitest';
import { MessengerSubscriptionRegistry } from './messenger-subscription-registry';
import { isMessengerSubscribeAckOk } from './messenger-subscribe-ack';

describe('messenger subscription registry', () => {
  it('emits one subscribe for two consumers and leaves only on the final release', () => {
    const registry = new MessengerSubscriptionRegistry();
    const first = registry.acquire('c1');
    const second = registry.acquire('c1');
    expect(first).toEqual({ conversationId: 'c1', generation: 1 });
    expect(second).toBeNull();
    expect(registry.refcount('c1')).toBe(2);
    expect(registry.acknowledge('c1', first?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('c1')).toBe(true);
    expect(registry.release('c1')).toBeNull();
    expect(registry.refcount('c1')).toBe(1);
    expect(registry.isJoined('c1')).toBe(true);
    expect(registry.release('c1')).toEqual({ conversationId: 'c1' });
    expect(registry.refcount('c1')).toBe(0);
    expect(registry.isJoined('c1')).toBe(false);
  });

  it('does not treat a false or missing ack as joined', () => {
    const registry = new MessengerSubscriptionRegistry();
    const denied = registry.acquire('denied');
    expect(registry.acknowledge('denied', denied?.generation ?? 0, false)).toBeNull();
    expect(registry.isJoined('denied')).toBe(false);
    expect(registry.release('denied')).toBeNull();
    const missing = registry.acquire('missing');
    expect(isMessengerSubscribeAckOk(undefined)).toBe(false);
    expect(isMessengerSubscribeAckOk({})).toBe(false);
    expect(isMessengerSubscribeAckOk({ ok: false })).toBe(false);
    expect(isMessengerSubscribeAckOk({ ok: true })).toBe(true);
    expect(registry.acknowledge('missing', missing?.generation ?? 0, false)).toBeNull();
    expect(registry.isJoined('missing')).toBe(false);
  });

  it('joins a still-retained conversation when a later ack succeeds after an early false', () => {
    const registry = new MessengerSubscriptionRegistry();
    const early = registry.acquire('c1');
    registry.holdForAuthorization('c1', early?.generation ?? 0);
    expect(registry.isJoined('c1')).toBe(false);
    expect(registry.refcount('c1')).toBe(1);
    expect(registry.acknowledge('c1', early?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('c1')).toBe(true);
  });

  it('retries a pre-authorization hold and does not retry a settled denial', () => {
    const registry = new MessengerSubscriptionRegistry();
    const held = registry.acquire('held');
    registry.holdForAuthorization('held', held?.generation ?? 0);
    const denied = registry.acquire('denied');
    expect(registry.acknowledge('denied', denied?.generation ?? 0, false)).toBeNull();
    const retried = registry.retryHeld();
    expect(retried).toEqual([{ conversationId: 'held', generation: 2 }]);
    expect(registry.acknowledge('held', retried[0]?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('held')).toBe(true);
    expect(registry.isJoined('denied')).toBe(false);
    expect(registry.acknowledge('held', held?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('held')).toBe(true);
  });

  it('leaves when a held subscribe later succeeds after the refcount hit zero', () => {
    const registry = new MessengerSubscriptionRegistry();
    const intent = registry.acquire('c1');
    registry.holdForAuthorization('c1', intent?.generation ?? 0);
    expect(registry.release('c1')).toBeNull();
    expect(registry.acknowledge('c1', intent?.generation ?? 0, true)).toEqual({
      conversationId: 'c1',
    });
    expect(registry.isJoined('c1')).toBe(false);
    expect(registry.acknowledge('c1', intent?.generation ?? 0, true)).toBeNull();
  });

  it('leaves on a late successful ack after the refcount already hit zero', () => {
    const registry = new MessengerSubscriptionRegistry();
    const intent = registry.acquire('c1');
    expect(registry.release('c1')).toBeNull();
    expect(registry.isJoined('c1')).toBe(false);
    expect(registry.acknowledge('c1', intent?.generation ?? 0, true)).toEqual({
      conversationId: 'c1',
    });
    expect(registry.isJoined('c1')).toBe(false);
    expect(registry.acknowledge('c1', intent?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('c1')).toBe(false);
  });

  it('does not leave when a stale ack arrives for a conversation that is still wanted', () => {
    const registry = new MessengerSubscriptionRegistry();
    const first = registry.acquire('c1');
    const restored = registry.resubscribeAll();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.generation).not.toBe(first?.generation);
    expect(registry.acknowledge('c1', first?.generation ?? 0, true)).toBeNull();
    expect(registry.isJoined('c1')).toBe(false);
  });

  it('restores only conversations whose refcount is still positive', () => {
    const registry = new MessengerSubscriptionRegistry();
    const joined = registry.acquire('a');
    registry.acquire('b');
    registry.acknowledge('a', joined?.generation ?? 0, true);
    registry.acquire('gone');
    registry.release('gone');
    const held = registry.acquire('held');
    registry.holdForAuthorization('held', held?.generation ?? 0);
    const restored = registry.resubscribeAll().map((intent) => intent.conversationId);
    expect(restored.sort()).toEqual(['a', 'b', 'held']);
    expect(registry.isJoined('a')).toBe(false);
    expect(registry.refcount('gone')).toBe(0);
  });
});
