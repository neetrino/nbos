import { describe, expect, it } from 'vitest';
import { atsPhoneLookupVariants, normalizeAtsCallerPhone } from './ats-phone.util';

describe('normalizeAtsCallerPhone', () => {
  it('normalizes Armenian national and +374 forms to E.164', () => {
    expect(normalizeAtsCallerPhone('+374 99 123456')).toEqual({
      success: true,
      digits: '37499123456',
      e164: '+37499123456',
    });
    expect(normalizeAtsCallerPhone('099123456')).toEqual({
      success: true,
      digits: '37499123456',
      e164: '+37499123456',
    });
  });

  it('rejects empty clid', () => {
    expect(normalizeAtsCallerPhone(null).success).toBe(false);
    expect(normalizeAtsCallerPhone('').success).toBe(false);
  });
});

describe('atsPhoneLookupVariants', () => {
  it('includes e164, digits, and AM national variants', () => {
    const variants = atsPhoneLookupVariants('+37499123456', '37499123456');
    expect(variants).toEqual(
      expect.arrayContaining(['+37499123456', '37499123456', '099123456', '99123456']),
    );
  });
});
