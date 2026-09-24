/** Date + access-level controls on a grant row (restormania-style pills). */
export const CREDENTIAL_GRANT_TRAILING_GAP_CLASS = 'flex items-center gap-1.5';

export const CREDENTIAL_GRANT_DATE_PILL_CLASS = 'rounded-full';

export const CREDENTIAL_GRANT_LEVEL_PILL_CLASS = [
  'h-8 min-h-8 w-auto shrink-0 rounded-full border border-border/70 bg-background px-3.5',
  'text-[11px] font-semibold tracking-wide uppercase shadow-none',
  'hover:border-border hover:bg-muted/40',
  'focus-visible:ring-ring/40 focus-visible:ring-2',
  'data-popup-open:border-border data-popup-open:bg-muted/40',
  '[&_svg]:hidden',
].join(' ');
