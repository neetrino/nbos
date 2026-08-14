'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ACCOUNT_MENU_APPEARANCE_LABEL } from '@/components/layout/account-menu-dropdown-constants';
import {
  THEME_SWITCHER_OPTIONS,
  parseThemePreference,
  type ThemePreference,
} from './theme-switcher-constants';

function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function ThemeSwitcherSegment({
  value,
  onChange,
  mounted,
}: {
  value: ThemePreference;
  onChange: (next: ThemePreference) => void;
  mounted: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ACCOUNT_MENU_APPEARANCE_LABEL}
      className="bg-muted flex gap-0.5 rounded-lg p-0.5"
    >
      {THEME_SWITCHER_OPTIONS.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            disabled={!mounted}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              selected
                ? 'bg-background text-foreground ring-ring shadow-sm ring-1'
                : 'text-muted-foreground hover:text-foreground',
              !mounted && 'opacity-70',
            )}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useClientMounted();
  const activeTheme = mounted ? parseThemePreference(theme) : 'system';

  return (
    <div className="border-border border-t px-3 py-3">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide">
        {ACCOUNT_MENU_APPEARANCE_LABEL}
      </p>
      <ThemeSwitcherSegment
        value={activeTheme}
        mounted={mounted}
        onChange={(next) => setTheme(next)}
      />
    </div>
  );
}
