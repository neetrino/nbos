import { describe, expect, it } from 'vitest';
import { parseProductDetailTab } from './product-detail-tab';

describe('parseProductDetailTab', () => {
  it('maps legacy bonus query to functions without loading bonus money', () => {
    expect(parseProductDetailTab('bonus')).toBe('functions');
  });

  it('keeps functions tab and falls back for unknown values', () => {
    expect(parseProductDetailTab('functions')).toBe('functions');
    expect(parseProductDetailTab('unknown')).toBe('overview');
  });
});
