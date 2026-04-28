import { describe, expect, it } from 'vitest';
import { parseOrderReconciliationListGap } from './order-reconciliation-list-filter';

describe('parseOrderReconciliationListGap', () => {
  it('accepts canonical gap values', () => {
    expect(parseOrderReconciliationListGap('uninvoiced')).toBe('uninvoiced');
    expect(parseOrderReconciliationListGap('outstanding')).toBe('outstanding');
  });

  it('returns null for unknown or missing values', () => {
    expect(parseOrderReconciliationListGap(undefined)).toBeNull();
    expect(parseOrderReconciliationListGap('')).toBeNull();
    expect(parseOrderReconciliationListGap('invalid')).toBeNull();
  });
});
