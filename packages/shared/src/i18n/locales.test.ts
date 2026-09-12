import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INTERFACE_LOCALE,
  isWritableInterfaceLocale,
  parseWritableInterfaceLocale,
} from './locales';

describe('interface locale allowlist', () => {
  it('accepts writable locales only', () => {
    expect(isWritableInterfaceLocale('en')).toBe(true);
    expect(isWritableInterfaceLocale('ru')).toBe(true);
    expect(isWritableInterfaceLocale('hy')).toBe(false);
    expect(isWritableInterfaceLocale('de')).toBe(false);
    expect(isWritableInterfaceLocale('')).toBe(false);
    expect(isWritableInterfaceLocale(null)).toBe(false);
  });

  it('falls back to English for reserved or invalid values', () => {
    expect(parseWritableInterfaceLocale('ru')).toBe('ru');
    expect(parseWritableInterfaceLocale('hy')).toBe(DEFAULT_INTERFACE_LOCALE);
    expect(parseWritableInterfaceLocale('EN')).toBe(DEFAULT_INTERFACE_LOCALE);
    expect(parseWritableInterfaceLocale(undefined)).toBe(DEFAULT_INTERFACE_LOCALE);
  });
});
