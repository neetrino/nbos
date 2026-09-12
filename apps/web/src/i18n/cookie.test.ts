import { afterEach, describe, expect, it, vi } from 'vitest';
import { INTERFACE_LOCALE_COOKIE } from './constants';
import { clearLocaleCookie, parseLocaleCookieValue, writeLocaleCookie } from './cookie';

const LEGACY_OWNER_COOKIE = 'nbos-interface-locale-owner';

describe('locale cookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts writable values and ignores reserved or junk', () => {
    expect(parseLocaleCookieValue('en')).toBe('en');
    expect(parseLocaleCookieValue('ru')).toBe('ru');
    expect(parseLocaleCookieValue('hy')).toBeUndefined();
    expect(parseLocaleCookieValue('de')).toBeUndefined();
    expect(parseLocaleCookieValue('')).toBeUndefined();
  });

  it('writes SameSite=Lax and expires the leftover owner cookie', () => {
    const jar: string[] = [];
    vi.stubGlobal('document', {
      set cookie(value: string) {
        jar.push(value);
      },
      get cookie() {
        return jar.join('; ');
      },
    });

    writeLocaleCookie('ru');

    expect(jar[0]).toContain(`${INTERFACE_LOCALE_COOKIE}=ru`);
    expect(jar[0]).toContain('SameSite=Lax');
    expect(jar[0]).toContain('Path=/');
    expect(jar[1]).toContain(`${LEGACY_OWNER_COOKIE}=`);
    expect(jar[1]).toContain('Max-Age=0');
  });

  it('expires both locale and leftover owner cookies on logout', () => {
    const jar: string[] = [];
    vi.stubGlobal('document', {
      set cookie(value: string) {
        jar.push(value);
      },
      get cookie() {
        return jar.join('; ');
      },
    });

    clearLocaleCookie();

    expect(jar).toEqual([
      `${INTERFACE_LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
      `${LEGACY_OWNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    ]);
  });
});

