'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS,
  ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS,
  ENTITY_NOTES_TOOLBAR_GROUP_CLASS,
} from '@/components/shared/entity-notes/entity-notes-field-classes';

export function ComposeToolbarBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        'text-muted-foreground size-8 shrink-0',
        active && ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function ComposeToolbarGroup({ children }: { children: ReactNode }) {
  return <div className={ENTITY_NOTES_TOOLBAR_GROUP_CLASS}>{children}</div>;
}

export function ComposeToolbarDivider() {
  return (
    <div
      className={ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export const COMPOSE_TOOLBAR_ICON_BTN_CLASS =
  'text-muted-foreground hover:bg-muted/70 focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';

export function ComposeToolbarIconShell({
  label,
  active,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      aria-label={label}
      aria-pressed={active}
      className={cn(
        COMPOSE_TOOLBAR_ICON_BTN_CLASS,
        active && ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS,
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {children}
    </span>
  );
}

export function ComposeToolbarSelect({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <select
      aria-label={label}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-border/60 bg-muted/20 text-foreground hover:bg-muted/30 h-8 max-w-[7.5rem] min-w-0 truncate rounded-lg border px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
    >
      {options.map((option) => (
        <option key={option.value || '__default'} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
