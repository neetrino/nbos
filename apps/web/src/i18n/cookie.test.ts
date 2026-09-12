import { describe, expect, it } from 'vitest';
import { parseLocaleCookieValue, parseLocaleOwnerCookieValue } from './cookie';

describe('locale cookie', () => {
  it('accepts writable values and ignores reserved or junk', () => {
    expect(parseLocaleCookieValue('en')).toBe('en');
    expect(parseLocaleCookieValue('ru')).toBe('ru');
    expect(parseLocaleCookieValue('hy')).toBeUndefined();
    expect(parseLocaleCookieValue('de')).toBeUndefined();
    expect(parseLocaleCookieValue('')).toBeUndefined();
  });

  it('keeps an owner id only when it is a non-empty string', () => {
    expect(parseLocaleOwnerCookieValue('employee-b')).toBe('employee-b');
    expect(parseLocaleOwnerCookieValue('  ')).toBeUndefined();
    expect(parseLocaleOwnerCookieValue(undefined)).toBeUndefined();
  });
});
