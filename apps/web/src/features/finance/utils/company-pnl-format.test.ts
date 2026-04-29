import { describe, expect, it } from 'vitest';
import { formatCompanyPnlMargin } from './company-pnl-format';

describe('formatCompanyPnlMargin', () => {
  it('formats margin percent and empty revenue state', () => {
    expect(formatCompanyPnlMargin(12.5)).toBe('12.50%');
    expect(formatCompanyPnlMargin(null)).toBe('N/A');
  });
});
