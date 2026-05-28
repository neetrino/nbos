import { describe, expect, it } from 'vitest';
import { moveLayoutId, togglePinnedId } from './payroll-matrix-layout-order';

describe('payroll-matrix-layout-order', () => {
  it('moves column id within order', () => {
    const all = ['a', 'b', 'c'];
    expect(moveLayoutId(all, 'b', -1, all)).toEqual(['b', 'a', 'c']);
    expect(moveLayoutId(all, 'b', 1, all)).toEqual(['a', 'c', 'b']);
  });

  it('toggles pinned ids', () => {
    expect(togglePinnedId(['x'], 'y')).toEqual(['x', 'y']);
    expect(togglePinnedId(['x', 'y'], 'y')).toEqual(['x']);
  });
});
