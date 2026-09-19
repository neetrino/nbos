import { describe, expect, it } from 'vitest';
import { decimalToNullableString } from '@nbos/shared';

describe('decimalToNullableString', () => {
  it('keeps null distinct from zero', () => {
    expect(decimalToNullableString(null)).toBeNull();
    expect(decimalToNullableString(undefined)).toBeNull();
    expect(decimalToNullableString({ toString: () => '0' })).toBe('0');
    expect(decimalToNullableString({ toString: () => '1.2500' })).toBe('1.2500');
  });
});
