import { describe, expect, it } from 'vitest';
import {
  AGENT_TOKEN_PREFIX,
  buildAgentTokenPrefix,
  generateAgentToken,
  isAgentToken,
  parseAgentToken,
} from './agent-token';

describe('generateAgentToken', () => {
  it('produces a parseable namespaced token', () => {
    const generated = generateAgentToken();

    expect(generated.token.startsWith(`${AGENT_TOKEN_PREFIX}_`)).toBe(true);
    expect(parseAgentToken(generated.token)).toEqual({
      keyId: generated.keyId,
      secret: generated.secret,
    });
  });

  it('generates unique high-entropy secrets', () => {
    const tokens = Array.from({ length: 20 }, () => generateAgentToken());
    const secrets = new Set(tokens.map((token) => token.secret));
    const keyIds = new Set(tokens.map((token) => token.keyId));

    expect(secrets.size).toBe(tokens.length);
    expect(keyIds.size).toBe(tokens.length);
    expect(tokens[0]!.secret.length).toBeGreaterThanOrEqual(32);
  });

  it('never emits the separator inside a segment, so every token parses', () => {
    const tokens = Array.from({ length: 200 }, () => generateAgentToken());

    for (const token of tokens) {
      expect(token.keyId).not.toContain('_');
      expect(token.secret).not.toContain('_');
      expect(parseAgentToken(token.token)).toEqual({
        keyId: token.keyId,
        secret: token.secret,
      });
    }
  });

  it('keeps the display prefix free of the full secret', () => {
    const generated = generateAgentToken();

    expect(generated.tokenPrefix).toContain(generated.keyId);
    expect(generated.tokenPrefix).not.toBe(generated.token);
    expect(generated.tokenPrefix).not.toContain(generated.secret);
    expect(generated.tokenPrefix.length).toBeLessThan(generated.token.length);
  });

  it('builds a stable display prefix', () => {
    expect(buildAgentTokenPrefix('abc', 'secretvalue')).toBe('nbos_agt_abc_secr');
  });
});

describe('parseAgentToken', () => {
  it('rejects tokens that are not agent credentials', () => {
    const employeeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbXAtMSIsInR5cCI6ImFjY2VzcyJ9.signature';

    expect(parseAgentToken(employeeJwt)).toBeNull();
    expect(isAgentToken(employeeJwt)).toBe(false);
  });

  it.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['wrong namespace', 'nbos_key_abc_secret'],
    ['missing secret', 'nbos_agt_abc'],
    ['extra segments', 'nbos_agt_abc_secret_more'],
    ['scheduler style key', 'some-random-scheduler-key'],
  ])('rejects %s', (_label, value) => {
    expect(parseAgentToken(value)).toBeNull();
  });

  it('rejects a token with an empty key id or secret', () => {
    expect(parseAgentToken('nbos_agt__secret')).toBeNull();
    expect(parseAgentToken('nbos_agt_abc_')).toBeNull();
  });

  describe('canonical shape', () => {
    const validKeyId = 'a'.repeat(18);
    const validSecret = 'b'.repeat(64);

    it('accepts only the exact generated shape', () => {
      expect(parseAgentToken(`nbos_agt_${validKeyId}_${validSecret}`)).toEqual({
        keyId: validKeyId,
        secret: validSecret,
      });
    });

    it.each([
      ['short key id', `nbos_agt_${'a'.repeat(17)}_${validSecret}`],
      ['long key id', `nbos_agt_${'a'.repeat(19)}_${validSecret}`],
      ['short secret', `nbos_agt_${validKeyId}_${'b'.repeat(63)}`],
      ['long secret', `nbos_agt_${validKeyId}_${'b'.repeat(65)}`],
      ['oversized payload', `nbos_agt_${validKeyId}_${'b'.repeat(100_000)}`],
      ['uppercase hex', `nbos_agt_${'A'.repeat(18)}_${'B'.repeat(64)}`],
      ['non-hex key id', `nbos_agt_${'z'.repeat(18)}_${validSecret}`],
      ['non-hex secret', `nbos_agt_${validKeyId}_${'z'.repeat(64)}`],
      ['base64url padding characters', `nbos_agt_${validKeyId}_${'-'.repeat(64)}`],
    ])('rejects %s before any lookup', (_label, value) => {
      expect(parseAgentToken(value)).toBeNull();
      expect(isAgentToken(value)).toBe(false);
    });
  });
});
