import { describe, expect, it } from 'vitest';
import {
  AMD_CURRENCY_SYMBOL,
  formatAmount,
  formatAmountAbbreviated,
  formatAmountDramSuffix,
  formatGroupedNumber,
  formatMoneyDram,
  formatMoneyDramOrDash,
  formatMoneyInput,
  parseMoneyAmount,
  sanitizeMoneyInput,
} from './money';

describe('money formatting', () => {
  it('groups thousands with hy-AM locale', () => {
    expect(formatGroupedNumber(3_500_000)).toBe('3\u00a0500\u00a0000');
  });

  it('formats dram amounts and dash placeholder', () => {
    expect(formatMoneyDram(1500)).toContain(AMD_CURRENCY_SYMBOL);
    expect(formatMoneyDramOrDash(null)).toBe('—');
    expect(formatMoneyDramOrDash(0)).toBe('—');
    expect(formatAmount(1500, 'AMD')).toBe(formatMoneyDram(1500));
    expect(formatAmountDramSuffix(1500)).toBe(`${formatGroupedNumber(1500)}${AMD_CURRENCY_SYMBOL}`);
  });

  it('abbreviates large amounts for compact grid cells', () => {
    expect(formatAmountAbbreviated(250_000)).toBe('250K');
    expect(formatAmountAbbreviated(2_500_000)).toBe('2.5M');
    expect(formatAmountAbbreviated(1_000)).toBe('1K');
    expect(formatAmountAbbreviated(1_500)).toBe('1.5K');
    expect(formatAmountAbbreviated(999)).toBe('999');
    expect(formatAmountAbbreviated(-250_000)).toBe('-250K');
  });

  it('parses grouped input strings', () => {
    expect(parseMoneyAmount('3 500 000')).toBe(3_500_000);
    expect(parseMoneyAmount('3\u00a0500\u00a0000')).toBe(3_500_000);
    expect(parseMoneyAmount('bad')).toBe(0);
  });

  it('sanitizes and formats money input while typing', () => {
    expect(sanitizeMoneyInput('3 500 abc000')).toBe('3500000');
    expect(formatMoneyInput('3500000')).toBe('3\u00a0500\u00a0000');
    expect(formatMoneyInput('3500000.5')).toBe('3\u00a0500\u00a0000.5');
    expect(formatMoneyInput('-1500000')).toBe('-1\u00a0500\u00a0000');
    expect(formatMoneyInput('')).toBe('');
  });
});
