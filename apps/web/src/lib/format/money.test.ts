import { describe, expect, it } from 'vitest';
import {
  AMD_CURRENCY_SYMBOL,
  formatAmount,
  formatAmountDramSuffix,
  formatGroupedNumber,
  formatMoneyDram,
  formatMoneyDramOrDash,
  parseMoneyAmount,
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

  it('parses grouped input strings', () => {
    expect(parseMoneyAmount('3 500 000')).toBe(3_500_000);
    expect(parseMoneyAmount('bad')).toBe(0);
  });
});
