import { describe, expect, it } from 'vitest';
import { isDarkBrandHex } from './brand-mark-fill';

describe('isDarkBrandHex', () => {
  it('treats GitHub and X as too dark for dark tiles', () => {
    expect(isDarkBrandHex('181717')).toBe(true);
    expect(isDarkBrandHex('000000')).toBe(true);
  });

  it('keeps saturated brand colors on both themes', () => {
    expect(isDarkBrandHex('F05032')).toBe(false);
    expect(isDarkBrandHex('007ACC')).toBe(false);
  });
});
