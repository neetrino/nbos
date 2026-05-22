/**
 * Shared layout tokens for CRM / delivery-style detail sheets (wide right panel + floating rail).
 * Prefer {@link EntityDetailSheetContent} for entity detail sheets; otherwise {@link SheetContent}.
 */

/** Matches Lead/Deal detail width: 75vw on `sm+`. */
export const DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[75vw]';

/** Anchor floating rail to the left edge of a 75vw right sheet. */
export const DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS = 'sm:right-[75vw]';

/** Narrower detail sheet for entities with less form density (e.g. Finance invoice). */
export const DETAIL_SHEET_CONTENT_WIDTH_COMPACT_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[42rem]';

/** Anchor floating rail to the left edge of a {@link DETAIL_SHEET_CONTENT_WIDTH_COMPACT_CLASS} sheet. */
export const DETAIL_SHEET_FLOATING_RAIL_ANCHOR_COMPACT_CLASS = 'sm:right-[42rem]';

/** Medium detail sheet (e.g. client service with more fields than invoice). */
export const DETAIL_SHEET_CONTENT_WIDTH_MEDIUM_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[48rem]';

export const DETAIL_SHEET_FLOATING_RAIL_ANCHOR_MEDIUM_CLASS = 'sm:right-[48rem]';

/**
 * Narrow auxiliary panel (bonus ledger, HR peek) — use with
 * {@link EntityDetailSheetContent} `layout="auxiliary"` (Close only by default).
 */
export const DETAIL_SHEET_CONTENT_WIDTH_AUXILIARY_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[36rem]';

export const DETAIL_SHEET_FLOATING_RAIL_ANCHOR_AUXILIARY_CLASS = 'sm:right-[36rem]';

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

/**
 * Border/background on hover or focus only (Bitrix-style detail fields).
 * Use on shells for inline fields, relation chips, and empty pickers.
 */
export const DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS = [
  'border border-transparent bg-transparent shadow-none',
  'transition-[border-color,background-color,box-shadow]',
  'hover:border-border/60 hover:bg-muted/20 hover:shadow-sm hover:shadow-black/[0.04]',
  'focus-within:border-border/60 focus-within:bg-muted/20 focus-within:shadow-sm focus-within:shadow-black/[0.04]',
].join(' ');

/** Controlled {@link InlineField} / date-in-shell wrapper. */
export const DETAIL_SHEET_FIELD_SHELL_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'flex w-full min-h-10 items-center gap-1 rounded-xl px-3 py-1.5',
].join(' ');

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

/** Full-width selected-value shell for {@link RelationPickerField} (all entity kinds). */
export const RELATION_PICKER_CHIP_SHELL_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'flex w-full min-w-0 items-center gap-2 rounded-xl py-1.5 pr-1 pl-2.5 text-sm',
].join(' ');

/** Vertical stack for multi-select relation chips (symmetric full-width rows). */
export const RELATION_PICKER_CHIP_STACK_CLASS = 'flex w-full flex-col gap-2';

/** Empty / add trigger aligned with relation chip width. */
export const RELATION_PICKER_EMPTY_TRIGGER_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm',
].join(' ');
