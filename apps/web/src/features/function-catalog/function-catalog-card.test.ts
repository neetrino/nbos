import { describe, expect, it } from 'vitest';
import { catalogCardUsesSelectedSurface } from './function-catalog-card';

describe('catalogCardUsesSelectedSurface', () => {
  it('highlights only the current selection, not already-added cards', () => {
    expect(catalogCardUsesSelectedSurface(true)).toBe(true);
    expect(catalogCardUsesSelectedSurface(false)).toBe(false);
  });
});
