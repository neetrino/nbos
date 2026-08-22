import { describe, expect, it } from 'vitest';
import {
  hashAgentSecret,
  primeAgentSecretVerifier,
  verifyAgainstDecoySecret,
  verifyAgentSecret,
} from './agent-secret-hash';

describe('agent secret hashing', () => {
  it('produces an argon2id verifier that never contains the secret', async () => {
    const hash = await hashAgentSecret('super-secret-value');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('super-secret-value');
  });

  it('salts every hash, so the same secret never produces the same verifier', async () => {
    const [first, second] = await Promise.all([
      hashAgentSecret('same-secret'),
      hashAgentSecret('same-secret'),
    ]);

    expect(first).not.toBe(second);
    expect(await verifyAgentSecret(first, 'same-secret')).toBe(true);
    expect(await verifyAgentSecret(second, 'same-secret')).toBe(true);
  });

  it('verifies the right secret and rejects the wrong one', async () => {
    const hash = await hashAgentSecret('right');

    expect(await verifyAgentSecret(hash, 'right')).toBe(true);
    expect(await verifyAgentSecret(hash, 'wrong')).toBe(false);
  });

  it('returns false instead of throwing on a malformed verifier', async () => {
    expect(await verifyAgentSecret('not-a-hash', 'anything')).toBe(false);
  });
});

describe('decoy verifier', () => {
  it('always fails, so an unknown key id can never authenticate', async () => {
    await primeAgentSecretVerifier();

    expect(await verifyAgainstDecoySecret('anything')).toBe(false);
    expect(await verifyAgainstDecoySecret('')).toBe(false);
  });

  it('runs the same verification path as a real credential check', async () => {
    await primeAgentSecretVerifier();
    const hash = await hashAgentSecret('real-secret');

    const realStart = process.hrtime.bigint();
    await verifyAgentSecret(hash, 'wrong-secret');
    const realCost = process.hrtime.bigint() - realStart;

    const decoyStart = process.hrtime.bigint();
    await verifyAgainstDecoySecret('wrong-secret');
    const decoyCost = process.hrtime.bigint() - decoyStart;

    // Same argon2 verification, so the same order of magnitude. A hash-based
    // stand-in would be visibly cheaper or costlier than a verify.
    const ratio = Number(decoyCost) / Number(realCost);
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(5);
  });
});
