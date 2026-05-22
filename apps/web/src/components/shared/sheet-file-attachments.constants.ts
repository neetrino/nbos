/** Files per row in sheet attachment grids (wraps to next line after this count). */
export const SHEET_FILE_GRID_COLUMNS = 4;

/** Dense grid for task sheet — small Bitrix-style thumbnails (8 default, 10 on sm+). */
export const SHEET_FILE_GRID_COLUMNS_DENSE = 8;

export const SHEET_FILE_TILE_LIMIT = 12;

/** Default section label in the attachment header (paperclip row). */
export const SHEET_FILE_SECTION_TITLE = 'Files';

/** White card matching task / entity sheet attachment mockups. */
export const SHEET_FILE_ATTACHMENTS_SURFACE_CLASS =
  'rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.05] dark:bg-card dark:ring-white/[0.07]';

/** When the parent already provides {@link SHEET_FILE_ATTACHMENTS_SURFACE_CLASS}. */
export const SHEET_FILE_ATTACHMENTS_EMBEDDED_CLASS = 'min-w-0';

export const SHEET_FILE_ATTACHMENTS_HEADER_CLASS =
  'flex min-h-9 items-center justify-between gap-2';

export const SHEET_FILE_ATTACHMENTS_TITLE_CLASS =
  'text-foreground flex min-w-0 items-center gap-1.5 text-sm font-medium';

export const SHEET_FILE_ATTACHMENTS_CLIP_ICON_CLASS = 'text-primary size-4 shrink-0 stroke-[1.75]';

export const SHEET_FILE_ATTACHMENTS_ADD_ICON_CLASS =
  'text-muted-foreground size-4 shrink-0 stroke-[1.5]';

/** Compact file tile (sheet attachment grid). */
export const SHEET_FILE_TILE_WIDTH_CLASS = 'w-[4.75rem]';

export const SHEET_FILE_TILE_SHELL_CLASS =
  'border-border/60 bg-background flex h-[4.75rem] w-full flex-col overflow-hidden rounded-lg border';

export const SHEET_FILE_TILE_ICON_AREA_CLASS =
  'relative flex min-h-0 flex-1 items-center justify-center p-1';

export const SHEET_FILE_TILE_NAME_CLASS =
  'text-muted-foreground line-clamp-2 px-1 pb-1 text-center text-[10px] leading-tight font-normal';

/** Monochrome extension badge on sheet tiles (screenshot style). */
export const SHEET_FILE_EXTENSION_BADGE_CLASS =
  'bg-stone-600 text-[8px] font-semibold tracking-wide text-white dark:bg-stone-500';
