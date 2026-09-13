import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INTERFACE_LOCALE,
  isKnownInterfaceLocale,
  isWritableInterfaceLocale,
  parseKnownInterfaceLocale,
  parseWritableInterfaceLocale,
} from './locales';

describe('interface locale allowlist', () => {
  it('accepts writable locales only', () => {
    expect(isWritableInterfaceLocale('en')).toBe(true);
    expect(isWritableInterfaceLocale('ru')).toBe(true);
    expect(isWritableInterfaceLocale('hy')).toBe(true);
    expect(isWritableInterfaceLocale('de')).toBe(false);
    expect(isWritableInterfaceLocale('')).toBe(false);
    expect(isWritableInterfaceLocale(null)).toBe(false);
  });

  it('falls back to English for invalid values', () => {
    expect(parseWritableInterfaceLocale('ru')).toBe('ru');
    expect(parseWritableInterfaceLocale('hy')).toBe('hy');
    expect(parseWritableInterfaceLocale('EN')).toBe(DEFAULT_INTERFACE_LOCALE);
    expect(parseWritableInterfaceLocale(undefined)).toBe(DEFAULT_INTERFACE_LOCALE);
  });

  it('parses known locales for system copy', () => {
    expect(isKnownInterfaceLocale('hy')).toBe(true);
    expect(parseKnownInterfaceLocale('hy')).toBe('hy');
    expect(parseKnownInterfaceLocale('de')).toBe(DEFAULT_INTERFACE_LOCALE);
  });
});
