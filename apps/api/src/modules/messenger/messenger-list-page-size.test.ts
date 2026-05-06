import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  clampMessengerListPageSize,
  clampMessengerPageSizeValue,
  parseMessengerBeforeCursor,
} from './messenger-list-page-size';

describe('messenger-list-page-size', () => {
  it('clampMessengerPageSizeValue falls back and caps', () => {
    expect(clampMessengerPageSizeValue(undefined)).toBe(100);
    expect(clampMessengerPageSizeValue(0)).toBe(100);
    expect(clampMessengerPageSizeValue(50)).toBe(50);
    expect(clampMessengerPageSizeValue(500)).toBe(100);
  });

  it('clampMessengerListPageSize parses query string', () => {
    expect(clampMessengerListPageSize(undefined)).toBe(100);
    expect(clampMessengerListPageSize('25')).toBe(25);
    expect(() => clampMessengerListPageSize('0')).toThrow(BadRequestException);
    expect(() => clampMessengerListPageSize('nope')).toThrow(BadRequestException);
  });

  it('parseMessengerBeforeCursor accepts ISO and rejects invalid', () => {
    expect(parseMessengerBeforeCursor(undefined)).toBeUndefined();
    expect(parseMessengerBeforeCursor('2026-04-01T12:00:00.000Z')?.toISOString()).toBe(
      '2026-04-01T12:00:00.000Z',
    );
    expect(() => parseMessengerBeforeCursor('not-a-date')).toThrow(BadRequestException);
  });
});
