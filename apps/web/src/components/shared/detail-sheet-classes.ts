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

/** Sub-label inside a merged multi-column section. */
export const DETAIL_SHEET_SUBSECTION_LABEL_CLASS =
  'text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase';

/** Vertical divider between columns inside one section card. */
export const DETAIL_SHEET_COLUMN_DIVIDER_CLASS =
  'border-stone-100 sm:border-l sm:pl-5 dark:border-stone-800';

/** Horizontal divider between stacked panels inside one section card. */
export const DETAIL_SHEET_PANEL_DIVIDER_CLASS =
  'border-t border-stone-100 pt-5 dark:border-stone-800';

/** Two columns of section cards; each row stretches to the taller sibling. */
export const DETAIL_SHEET_PAIRED_COLUMNS_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch sm:gap-5';

/** Stretch a section card to the full height of its grid row. */
export const DETAIL_SHEET_SECTION_STRETCH_CLASS = 'flex h-full min-h-0 flex-col';

/** Highlights a field required for the current stage transition attempt. */
export const DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS =
  'ring-1 ring-red-400/90 ring-offset-1 ring-offset-background rounded-xl';

/** Span both columns in {@link DETAIL_SHEET_PAIRED_COLUMNS_CLASS} (full row width). */
export const DETAIL_SHEET_PAIRED_FULL_WIDTH_CLASS = 'sm:col-span-2';

/** Body inside a stretched section — stacks fields and absorbs extra row height. */
export const DETAIL_SHEET_SECTION_BODY_CLASS = 'flex flex-1 flex-col space-y-4';

/** Neutral avatar chip for person pickers (avoids per-role accent colors). */
export const DETAIL_SHEET_PERSON_AVATAR_CLASS =
  'bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold uppercase';

/** Scoped group on a field shell — action icons show when hovering the control. */
export const DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS = 'group/field';

/** Fade-in for clear / edit affordances inside {@link DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS}. */
export const DETAIL_SHEET_FIELD_ACTIONS_ON_HOVER_CLASS =
  'opacity-0 transition-opacity group-hover/field:opacity-100 group-focus-within/field:opacity-100';

/** Clear (X) button inside picker/select shells. */
export const DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS = [
  'text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md',
  'transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100',
  DETAIL_SHEET_FIELD_ACTIONS_ON_HOVER_CLASS,
].join(' ');

/** Decorative edit (pencil) hint on closed picker fields. */
export const DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS = [
  'text-muted-foreground/70 shrink-0',
  DETAIL_SHEET_FIELD_ACTIONS_ON_HOVER_CLASS,
].join(' ');
