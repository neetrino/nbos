import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseSubscriptionStatusQuery } from './subscription-status-query';

describe('parseSubscriptionStatusQuery', () => {
  it('returns undefined when status is omitted or blank', () => {
    expect(parseSubscriptionStatusQuery(undefined)).toBeUndefined();
    expect(parseSubscriptionStatusQuery('')).toBeUndefined();
    expect(parseSubscriptionStatusQuery('   ')).toBeUndefined();
  });

  it('returns a single enum for one token', () => {
    expect(parseSubscriptionStatusQuery('PENDING')).toBe('PENDING');
    expect(parseSubscriptionStatusQuery(' CANCELLED ')).toBe('CANCELLED');
  });

  it('returns { in } for a comma-separated list', () => {
    expect(parseSubscriptionStatusQuery('PENDING,ACTIVE')).toEqual({
      in: ['PENDING', 'ACTIVE'],
    });
    expect(parseSubscriptionStatusQuery(' PENDING , ACTIVE ')).toEqual({
      in: ['PENDING', 'ACTIVE'],
    });
  });

  it('rejects empty tokens and invalid statuses', () => {
    expect(() => parseSubscriptionStatusQuery('PENDING,')).toThrow(BadRequestException);
    expect(() => parseSubscriptionStatusQuery(',ACTIVE')).toThrow(BadRequestException);
    expect(() => parseSubscriptionStatusQuery('PENDING,FOO')).toThrow(BadRequestException);
    expect(() => parseSubscriptionStatusQuery('working')).toThrow(BadRequestException);
  });
});
