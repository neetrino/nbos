import { describe, it, expect } from 'vitest';
import {
  parsePartnerDefaultPercentInput,
  formatPartnerDefaultPercentForForm,
} from './partner-default-percent';

describe('parsePartnerDefaultPercentInput', () => {
  it('parses integers and decimals', () => {
    expect(parsePartnerDefaultPercentInput('30')).toBe(30);
    expect(parsePartnerDefaultPercentInput('12.5')).toBe(12.5);
    expect(parsePartnerDefaultPercentInput('12,5')).toBe(12.5);
  });

  it('rejects out of range', () => {
    expect(parsePartnerDefaultPercentInput('-1')).toBeNull();
    expect(parsePartnerDefaultPercentInput('101')).toBeNull();
  });

  it('rejects invalid', () => {
    expect(parsePartnerDefaultPercentInput('')).toBeNull();
    expect(parsePartnerDefaultPercentInput('abc')).toBeNull();
  });
});

describe('formatPartnerDefaultPercentForForm', () => {
  it('formats API-like decimals', () => {
    expect(formatPartnerDefaultPercentForForm('30.00')).toBe('30');
    expect(formatPartnerDefaultPercentForForm(25.5)).toBe('25.5');
  });
});
