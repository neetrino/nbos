/** Round in-call controls. Shared so the bar and the record button match. */
export const CALL_ICON_BUTTON_CLASS =
  'inline-flex size-11 items-center justify-center rounded-full border border-border/70 bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5';

export const CALL_HANGUP_BUTTON_CLASS =
  'inline-flex size-12 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-40';

export const EXPANDED_CALL_SHELL_CLASS =
  'fixed inset-4 z-[70] flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-background shadow-2xl md:inset-8';

export const MINIMIZED_CALL_SHELL_CLASS =
  'fixed right-4 bottom-4 z-[70] w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-xl';
