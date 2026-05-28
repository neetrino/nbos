import { describe, expect, it } from 'vitest';
import { applyCustomOrder } from './payroll-matrix-layout';

describe('applyCustomOrder', () => {
  it('places custom ids first and appends unknown items', () => {
    const items = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];
    const ordered = applyCustomOrder(items, ['c', 'a']);
    expect(ordered.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns original order when custom order is empty', () => {
    const items = [{ id: 'x' }, { id: 'y' }];
    expect(applyCustomOrder(items, [])).toEqual(items);
  });
});
