import { describe, expect, it } from 'vitest';
import { parseLocaleCookieValue } from './cookie';

describe('locale cookie', () => {
  it('accepts writable values and ignores reserved or junk', () => {
    expect(parseLocaleCookieValue('en')).toBe('en');
    expect(parseLocaleCookieValue('ru')).toBe('ru');
    expect(parseLocaleCookieValue('hy')).toBeUndefined();
    expect(parseLocaleCookieValue('de')).toBeUndefined();
    expect(parseLocaleCookieValue('')).toBeUndefined();
  });
});
