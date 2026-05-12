import { describe, it, expect } from 'vitest';
import { formatTaskCode, nextTaskCodeNumericSuffix } from './task-code-generation';

describe('task-code-generation', () => {
  it('picks max numeric suffix, not lexicographic max', () => {
    const year = 2026;
    const codes = ['T-2026-0009', 'T-2026-10000', 'T-2026-0001'];
    expect(nextTaskCodeNumericSuffix(year, codes)).toBe(10001);
  });

  it('formats padded code', () => {
    expect(formatTaskCode(2026, 7)).toBe('T-2026-0007');
  });

  it('starts at 1 when no matching codes', () => {
    expect(nextTaskCodeNumericSuffix(2026, [])).toBe(1);
  });
});
