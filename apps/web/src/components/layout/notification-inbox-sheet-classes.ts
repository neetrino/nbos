import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';

/** Notification inbox — 85vw on mobile, half viewport on desktop. */
export const NOTIFICATION_INBOX_SHEET_CONTENT_CLASS =
  'flex h-[calc(100vh-2.5vh)] max-h-[calc(100vh-2.5vh)] w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:h-[calc(100vh-2.5vh)] data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[50vw]';

export const NOTIFICATION_INBOX_SHEET_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[50vw]`;

export const NOTIFICATION_INBOX_HEADER_CLASS =
  'border-border flex w-full shrink-0 flex-row items-center justify-between gap-4 border-b px-5 py-4 text-left sm:px-7';

export const NOTIFICATION_INBOX_TITLE_CLASS =
  'text-foreground text-left text-lg font-semibold tracking-tight';

export const NOTIFICATION_INBOX_HEADER_ACTIONS_CLASS = 'flex shrink-0 items-center gap-2';

export const NOTIFICATION_INBOX_HEADER_ACTION_CLASS =
  'text-accent hover:text-accent/80 text-xs font-medium transition-colors';

export const NOTIFICATION_INBOX_SETTINGS_BUTTON_CLASS =
  'text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg p-2 transition-colors';

export const NOTIFICATION_INBOX_BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7';

export const NOTIFICATION_INBOX_LIST_CLASS = 'space-y-2';

export const NOTIFICATION_INBOX_STATUS_CLASS =
  'text-muted-foreground px-2 py-10 text-center text-sm';

export const NOTIFICATION_INBOX_ROW_BASE_CLASS =
  'border-border bg-card hover:bg-muted/30 focus-visible:ring-ring flex w-full items-start gap-3 rounded-xl border p-3.5 text-left shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 sm:p-4';

export const NOTIFICATION_INBOX_ROW_UNREAD_CLASS = 'bg-secondary/40';

export const NOTIFICATION_INBOX_ICON_WRAP_CLASS =
  'flex size-10 shrink-0 items-center justify-center rounded-lg';

export const NOTIFICATION_INBOX_TITLE_TEXT_CLASS = 'text-foreground truncate text-sm font-semibold';

export const NOTIFICATION_INBOX_BODY_TEXT_CLASS =
  'text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed';

export const NOTIFICATION_INBOX_TIME_CLASS =
  'text-muted-foreground flex shrink-0 flex-col items-end gap-0.5 text-right text-xs tabular-nums';

export const NOTIFICATION_INBOX_CLOCK_CLASS = 'text-muted-foreground/80 text-[11px] tabular-nums';

export const NOTIFICATION_INBOX_UNREAD_DOT_CLASS = 'bg-accent h-1.5 w-1.5 shrink-0 rounded-full';
