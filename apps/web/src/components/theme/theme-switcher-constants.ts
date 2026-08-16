import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';

/** LocalStorage key for next-themes (must match ThemeProvider). */
export const THEME_STORAGE_KEY = 'nbos-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export type ThemeSwitcherOption = {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
};

export const THEME_SWITCHER_OPTIONS: readonly ThemeSwitcherOption[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Returns true when value is a supported theme preference. */
export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Coerces unknown persisted values to a safe theme preference. */
export function parseThemePreference(value: string | null | undefined): ThemePreference {
  if (value != null && isThemePreference(value)) {
    return value;
  }
  return 'system';
}
