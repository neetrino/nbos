import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateCandidateShape } from './ai-model-policy.rules';

describe('validateCandidateShape PRIMARY_FALLBACK', () => {
  it('rejects inverted priority where FALLBACK is first', () => {
    expect(() =>
      validateCandidateShape('PRIMARY_FALLBACK', [
        { modelId: 'fallback', role: 'FALLBACK', priority: 0 },
        { modelId: 'primary', role: 'PRIMARY', priority: 10 },
      ]),
    ).toThrow(/lowest priority/i);
  });

  it('rejects a disabled PRIMARY', () => {
    expect(() =>
      validateCandidateShape('PRIMARY_FALLBACK', [
        { modelId: 'primary', role: 'PRIMARY', priority: 0, enabled: false },
        { modelId: 'fallback', role: 'FALLBACK', priority: 1 },
      ]),
    ).toThrow(/exactly one enabled PRIMARY/);
  });

  it('rejects duplicate priorities', () => {
    expect(() =>
      validateCandidateShape('PRIMARY_FALLBACK', [
        { modelId: 'primary', role: 'PRIMARY', priority: 0 },
        { modelId: 'fallback', role: 'FALLBACK', priority: 0 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('accepts PRIMARY at the lowest enabled priority', () => {
    expect(() =>
      validateCandidateShape('PRIMARY_FALLBACK', [
        { modelId: 'primary', role: 'PRIMARY', priority: 0 },
        { modelId: 'fallback', role: 'FALLBACK', priority: 1 },
      ]),
    ).not.toThrow();
  });
});
