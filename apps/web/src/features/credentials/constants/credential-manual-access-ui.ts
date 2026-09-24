/** Date + access-level controls on a grant row (ghost, hover-only fill). */
export const CREDENTIAL_GRANT_TRAILING_GAP_CLASS = 'flex items-center gap-2.5';

export const CREDENTIAL_GRANT_LEVEL_GHOST_CLASS = [
  'h-8 min-h-8 w-auto shrink-0 gap-0.5 rounded-full border-0 bg-transparent px-2 shadow-none',
  'text-[11px] font-semibold tracking-wide uppercase text-muted-foreground',
  'hover:border-0 hover:bg-muted/40 hover:text-foreground hover:shadow-none',
  'dark:border-0 dark:bg-transparent dark:hover:border-0 dark:hover:bg-muted/40',
  'focus-visible:border-0 focus-visible:bg-muted/40 focus-visible:text-foreground',
  'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none',
  'data-popup-open:border-0 data-popup-open:bg-muted/40 data-popup-open:text-foreground data-popup-open:shadow-none',
  'data-[size=sm]:h-8 data-[size=sm]:min-h-8 data-[size=sm]:rounded-full data-[size=sm]:px-2 data-[size=sm]:pr-1.5',
  '*:data-[slot=select-value]:flex-none [&_svg]:size-3.5',
].join(' ');
