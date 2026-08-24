export const CALL_NOTE_MAX_LENGTH = 4_000;

/** Above nested sheets (z-80) so the call window stays on top. */
export const ACTIVE_CALL_SCREEN_Z_CLASS = 'z-[85]';

export const ACTIVE_CALL_SHELL_CLASS = 'fixed inset-0 flex items-center justify-center p-4';

export const ACTIVE_CALL_OVERLAY_CLASS =
  'absolute inset-0 bg-black/25 supports-backdrop-filter:backdrop-blur-sm';

export const ACTIVE_CALL_PANEL_CLASS =
  'bg-card ring-foreground/10 relative flex min-h-0 max-h-[min(calc(100dvh-2rem),52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-lg ring-1 shadow-black/[0.07] outline-none';

export const ACTIVE_CALL_CONTEXT_CARD_CLASS =
  'border-border/80 bg-muted/30 flex flex-col rounded-xl border p-4';

export const ACTIVE_CALL_MINI_ACCENT_BAR_CLASS =
  'mt-0.5 w-0.5 min-h-7 shrink-0 self-stretch rounded-full';

export const ACTIVE_CALL_MINI_META_ICON_CLASS =
  'flex size-6 shrink-0 items-center justify-center rounded-full';

export const ACTIVE_CALL_MINI_META_ICON_SIZE = 12;

export const ACTIVE_CALL_CONTACT_ACCENT_CLASS = 'bg-sky-500';
export const ACTIVE_CALL_CONTACT_META_ICON_CLASS = 'bg-sky-500/10 text-sky-600 dark:text-sky-400';

export const ACTIVE_CALL_DEAL_ACCENT_CLASS = 'bg-green-500';
export const ACTIVE_CALL_DEAL_META_ICON_CLASS =
  'bg-green-500/10 text-green-600 dark:text-green-400';

export const ACTIVE_CALL_EMPTY_ACCENT_CLASS = 'bg-muted-foreground/40';
export const ACTIVE_CALL_EMPTY_META_ICON_CLASS = 'bg-muted text-muted-foreground';

export const ACTIVE_CALL_PHASE_BADGE_CLASS = {
  ringing: 'bg-primary/10 text-primary',
  answered: 'bg-success/15 text-success',
  ended: 'bg-muted text-muted-foreground',
} as const;
