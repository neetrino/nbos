import { describe, expect, it } from 'vitest';
import { financeUsesDealScopedParticipation } from './finance-seller-role';

describe('financeUsesDealScopedParticipation', () => {
  it('returns true for seller slug', () => {
    expect(financeUsesDealScopedParticipation('seller')).toBe(true);
    expect(financeUsesDealScopedParticipation('Seller')).toBe(true);
  });

  it('returns false for other roles', () => {
    expect(financeUsesDealScopedParticipation('pm')).toBe(false);
    expect(financeUsesDealScopedParticipation(undefined)).toBe(false);
  });
});
