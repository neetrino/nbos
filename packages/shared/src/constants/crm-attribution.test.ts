import { describe, it, expect } from 'vitest';
import { isLeadAttributionLocked } from './crm-attribution';

describe('isLeadAttributionLocked', () => {
  it('treats ON_HOLD like NEW (attribution not locked)', () => {
    expect(isLeadAttributionLocked('NEW')).toBe(false);
    expect(isLeadAttributionLocked('ON_HOLD')).toBe(false);
    expect(isLeadAttributionLocked('SPAM')).toBe(false);
    expect(isLeadAttributionLocked('MQL')).toBe(true);
  });
});
