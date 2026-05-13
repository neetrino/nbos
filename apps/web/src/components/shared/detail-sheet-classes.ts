/**
 * Shared layout tokens for CRM / delivery-style detail sheets (wide right panel + floating rail).
 * Use with {@link SheetContent} from `@/components/ui/sheet`.
 */

/** Matches Lead/Deal detail width: 75vw on `sm+`. */
export const DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[75vw]';

/** Anchor floating rail to the left edge of a 75vw right sheet. */
export const DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS = 'sm:right-[75vw]';

/** Block surface aligned with Deal General sections. */
export const DETAIL_SHEET_SECTION_SURFACE_CLASS =
  'rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent';

/** Section heading style (uppercase micro label). */
export const DETAIL_SHEET_SECTION_TITLE_CLASS =
  'text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase';
