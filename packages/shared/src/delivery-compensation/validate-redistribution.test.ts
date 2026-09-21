import { describe, expect, it } from 'vitest';
import { validateRedistributionPair } from './validate-redistribution';

describe('validateRedistributionPair', () => {
  it('rejects empty fields instead of defaulting 0/100 or 50/50', () => {
    expect(validateRedistributionPair({ outgoingPercent: '', incomingPercent: '100' })).toBe(
      'REDISTRIBUTION_REQUIRED',
    );
    expect(validateRedistributionPair({ outgoingPercent: '50', incomingPercent: '' })).toBe(
      'REDISTRIBUTION_REQUIRED',
    );
  });

  it('accepts an explicit 40/60 split', () => {
    expect(validateRedistributionPair({ outgoingPercent: '40', incomingPercent: '60' })).toBeNull();
  });

  it('rejects a pair that does not sum to 100', () => {
    expect(validateRedistributionPair({ outgoingPercent: '40', incomingPercent: '50' })).toBe(
      'SHARE_PERCENT_TOTAL',
    );
  });
});
