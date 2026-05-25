/** Files per row in sheet attachment grids (wraps to next line after this count). */
export const SHEET_FILE_GRID_COLUMNS = 4;

/** Dense grid for task sheet — small Bitrix-style thumbnails (8 default, 10 on sm+). */
export const SHEET_FILE_GRID_COLUMNS_DENSE = 8;

export const SHEET_FILE_TILE_LIMIT = 12;

/** Default section label in the attachment header (paperclip row). */
export const SHEET_FILE_SECTION_TITLE = 'Files';

/** White card — reference mockup (subtle stroke, no grey fill). */
export const SHEET_FILE_ATTACHMENTS_SURFACE_CLASS =
  'rounded-xl border border-black/[0.07] bg-white p-3 dark:border-white/[0.08] dark:bg-card';

/** When the parent already provides {@link SHEET_FILE_ATTACHMENTS_SURFACE_CLASS}. */
export const SHEET_FILE_ATTACHMENTS_EMBEDDED_CLASS = 'min-w-0';

export const SHEET_FILE_ATTACHMENTS_HEADER_CLASS =
  'flex min-h-8 items-center justify-between gap-3';

export const SHEET_FILE_ATTACHMENTS_TITLE_CLASS =
  'text-foreground flex min-w-0 items-center gap-1.5 text-sm font-medium tracking-tight';

export const SHEET_FILE_ATTACHMENTS_CLIP_ICON_CLASS = 'text-primary size-4 shrink-0 stroke-[1.75]';

/** Plain “+” — no button chrome (mockup). */
export const SHEET_FILE_ATTACHMENTS_ADD_BUTTON_CLASS =
  'text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50';

export const SHEET_FILE_ATTACHMENTS_ADD_ICON_CLASS = 'size-5 shrink-0 stroke-[1.75]';

/** Portrait tile — slightly taller than wide (mockup). */
export const SHEET_FILE_TILE_HEIGHT_CLASS = 'h-[5.75rem]';

export const SHEET_FILE_TILE_WIDTH_CLASS = 'w-[5.25rem]';

export const SHEET_FILE_TILE_SHELL_CLASS =
  'flex w-full flex-col overflow-hidden rounded-xl border-2 border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-card';

export const SHEET_FILE_TILE_ICON_AREA_CLASS =
  'relative flex min-h-0 flex-1 items-center justify-center px-1.5 pt-1.5';

/** Wider document glyph centered in the tile (mockup). */
export const SHEET_FILE_TILE_FILE_ICON_CLASS =
  'text-stone-300 h-7 w-8 stroke-[1.25] dark:text-stone-500';

/** Drive thumbnail overrides inside sheet tiles (no grey fill). */
export const SHEET_FILE_TILE_THUMBNAIL_CLASS =
  'size-auto max-h-8 w-full bg-transparent [&_img]:mx-auto [&_img]:max-h-8 [&_img]:w-auto [&_img]:object-contain [&_svg]:h-7 [&_svg]:w-8 [&_svg]:text-stone-300';

export const SHEET_FILE_TILE_NAME_CLASS =
  'text-muted-foreground line-clamp-2 px-1 pb-1 text-center text-[10px] leading-tight font-normal';

/** Monochrome extension badge centered on the icon. */
export const SHEET_FILE_EXTENSION_BADGE_CLASS =
  'bg-stone-600 text-[8px] font-semibold tracking-wide text-white dark:bg-stone-500';
