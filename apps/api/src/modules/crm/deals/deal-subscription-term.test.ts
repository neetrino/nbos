import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { parseOptionalSubscriptionTermMonths } from './deal-subscription-term';

describe('parseOptionalSubscriptionTermMonths', () => {
  it('leaves undefined untouched', () => {
    expect(parseOptionalSubscriptionTermMonths(undefined)).toBeUndefined();
  });

  it('accepts null to clear the term', () => {
    expect(parseOptionalSubscriptionTermMonths(null)).toBeNull();
  });

  it('accepts integers from 1 to 120', () => {
    expect(parseOptionalSubscriptionTermMonths(1)).toBe(1);
    expect(parseOptionalSubscriptionTermMonths(6)).toBe(6);
    expect(parseOptionalSubscriptionTermMonths(120)).toBe(120);
  });

  it('rejects out-of-range and non-integer values', () => {
    expect(() => parseOptionalSubscriptionTermMonths(0)).toThrow(BadRequestException);
    expect(() => parseOptionalSubscriptionTermMonths(121)).toThrow(BadRequestException);
    expect(() => parseOptionalSubscriptionTermMonths(1.5)).toThrow(BadRequestException);
  });
});
