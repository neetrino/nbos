import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseOptionalIsoDate } from './ai-admin-dates';

describe('parseOptionalIsoDate', () => {
  it('leaves undefined unchanged and treats empty as null', () => {
    expect(parseOptionalIsoDate(undefined)).toBeUndefined();
    expect(parseOptionalIsoDate(null)).toBeNull();
    expect(parseOptionalIsoDate('')).toBeNull();
  });

  it('parses ISO timestamps and rejects invalid values', () => {
    expect(parseOptionalIsoDate('2026-08-22T00:00:00.000Z')?.toISOString()).toBe(
      '2026-08-22T00:00:00.000Z',
    );
    expect(() => parseOptionalIsoDate('not-a-date')).toThrow(BadRequestException);
  });
});
