import { describe, expect, it } from 'vitest';
import { resolveAgentCorrelationId, sanitizeCorrelationId } from './agent-correlation';

describe('agent correlation id', () => {
  it('keeps a usable client-supplied id', () => {
    expect(resolveAgentCorrelationId('cursor-run-42')).toBe('cursor-run-42');
  });

  it('mints one when the client sends nothing', () => {
    const minted = resolveAgentCorrelationId(undefined);

    expect(minted).toHaveLength(36);
    expect(minted).not.toBe(resolveAgentCorrelationId(null));
  });

  it('mints one when the client sends only whitespace', () => {
    expect(resolveAgentCorrelationId('   ')).toHaveLength(36);
  });

  it('strips control characters so a client cannot forge log lines', () => {
    const forged = 'run-1\n{"event":"agent.auth_failed","reason":"fake"}';

    expect(sanitizeCorrelationId(forged)).not.toContain('\n');
    expect(sanitizeCorrelationId(forged)).not.toContain('"');
  });

  it('bounds the length', () => {
    expect(sanitizeCorrelationId('a'.repeat(500))).toHaveLength(128);
  });

  it('rejects a non-string value', () => {
    expect(sanitizeCorrelationId(null)).toBeNull();
  });
});
