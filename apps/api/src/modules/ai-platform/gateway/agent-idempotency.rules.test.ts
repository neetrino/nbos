import { describe, expect, it } from 'vitest';
import { fingerprintCapabilityRequest, requireIdempotencyKey } from './agent-idempotency.rules';
import { AgentAccessException } from '../auth/agent-auth.errors';

describe('idempotency rules', () => {
  it('accepts a canonical key', () => {
    expect(requireIdempotencyKey('retry-create-1')).toBe('retry-create-1');
  });

  it('rejects missing, oversized and malformed keys', () => {
    expect(() => requireIdempotencyKey(null)).toThrow(AgentAccessException);
    expect(() => requireIdempotencyKey('a'.repeat(200))).toThrow(AgentAccessException);
    expect(() => requireIdempotencyKey('has space')).toThrow(AgentAccessException);
  });

  it('fingerprints input stably so key order does not create a new operation', () => {
    const left = fingerprintCapabilityRequest({ title: 'A', workspaceId: 'ws-1' });
    const right = fingerprintCapabilityRequest({ workspaceId: 'ws-1', title: 'A' });
    expect(left).toBe(right);
  });

  it('changes fingerprint when payload bytes differ', () => {
    const input = { taskId: 't1', fileName: 'a.zip' };
    const one = fingerprintCapabilityRequest(input, new Uint8Array([1]));
    const two = fingerprintCapabilityRequest(input, new Uint8Array([2]));
    expect(one).not.toBe(two);
  });
});
