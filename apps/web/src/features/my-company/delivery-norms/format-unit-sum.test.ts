import { describe, expect, it } from 'vitest';
import { formatUnitSum, UNIT_SUM_EMPTY } from './format-unit-sum';

describe('formatUnitSum', () => {
  it('strips scale zeros and keeps a real fraction', () => {
    expect(formatUnitSum('10.0000')).toBe('10');
    expect(formatUnitSum('12.5000')).toBe('12.5');
    expect(formatUnitSum('0.0000')).toBe('0');
    expect(UNIT_SUM_EMPTY).toBe('—');
  });
});
