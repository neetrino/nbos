import { describe, expect, it } from 'vitest';
import { expenseOwnerLabel } from './expense-owner-label';

describe('expenseOwnerLabel', () => {
  it('prefers product name', () => {
    expect(
      expenseOwnerLabel({
        productId: 'prod-1',
        product: { name: 'Site' },
        project: { name: 'Alpha' },
      }),
    ).toBe('Site');
  });

  it('shows grandfather project when product is missing', () => {
    expect(
      expenseOwnerLabel({
        productId: null,
        product: null,
        project: { name: 'Alpha' },
      }),
    ).toBe('Project · Alpha');
  });

  it('returns null when neither owner is present', () => {
    expect(expenseOwnerLabel({ productId: null, product: null, project: null })).toBeNull();
  });
});
