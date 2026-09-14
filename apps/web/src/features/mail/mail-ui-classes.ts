/**
 * Visual tokens for Mail workspace, compose sheet, and thread surfaces.
 * Keep mail chrome on shared NBOS outlined-field / sheet language.
 */

export const MAIL_FIELD_GRID_CLASS = 'grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2';

export const MAIL_SHEET_BODY_CLASS = 'flex min-h-0 flex-1 flex-col gap-4 px-5 py-4';

export const MAIL_SHEET_FOOTER_CLASS =
  'border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 shrink-0 border-t px-5 py-4 backdrop-blur-sm';

export const MAIL_INBOX_CANVAS_CLASS =
  'border-border bg-card flex min-h-0 flex-1 overflow-hidden rounded-2xl border';

export const MAIL_FOLDER_ASIDE_CLASS =
  'border-border bg-muted/20 hidden w-52 shrink-0 flex-col border-r md:flex lg:w-56';

export const MAIL_FOLDER_NAV_BUTTON_CLASS =
  'focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2';

export const MAIL_FOLDER_NAV_BUTTON_ACTIVE_CLASS = 'bg-primary/10 text-primary font-medium';

export const MAIL_FOLDER_NAV_BUTTON_IDLE_CLASS = 'text-foreground hover:bg-muted/70';

export const MAIL_THREAD_ROW_CLASS = 'group hover:bg-muted/40 flex items-stretch transition-colors';

export const MAIL_THREAD_ROW_ACTIVE_CLASS = 'bg-primary/10';

export const MAIL_THREAD_ROW_UNREAD_CLASS = 'bg-muted/25';

export const MAIL_MESSAGE_CARD_CLASS =
  'border-border bg-card rounded-2xl border p-4 shadow-sm shadow-black/[0.03]';

export const MAIL_AVATAR_CLASS =
  'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold uppercase';

export const MAIL_PROVIDER_TILE_CLASS =
  'border-border bg-card hover:border-primary/30 hover:bg-muted/40 focus-visible:ring-ring flex flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm shadow-black/[0.03] transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60';
