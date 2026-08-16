import { describe, expect, it } from 'vitest';
import {
  THEME_PREFERENCES,
  isThemePreference,
  parseThemePreference,
} from './theme-switcher-constants';

describe('isThemePreference', () => {
  it('accepts supported values', () => {
    for (const value of THEME_PREFERENCES) {
      expect(isThemePreference(value)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference('')).toBe(false);
  });
});

describe('parseThemePreference', () => {
  it('returns the value when valid', () => {
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
    expect(parseThemePreference('system')).toBe('system');
  });

  it('falls back to system for invalid or missing values', () => {
    expect(parseThemePreference(undefined)).toBe('system');
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('high-contrast')).toBe('system');
  });
});
