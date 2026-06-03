/**
 * Shared layout tokens for CRM / delivery-style detail sheets (wide right panel + floating rail).
 * Prefer {@link EntityDetailSheetContent} for entity detail sheets; otherwise {@link SheetContent}.
 */

/** Vertical inset from viewport edges — pairs with {@link SHEET_VIEWPORT_MAX_HEIGHT_CLASS}. */
export const SHEET_VIEWPORT_INSET_CLASS = 'top-[2.5vh] bottom-[2.5vh]';

/** Max panel height; use with {@link SHEET_VIEWPORT_INSET_CLASS} on edge-attached sheets. */
export const SHEET_VIEWPORT_MAX_HEIGHT_CLASS = 'h-auto max-h-[95vh]';

/** Floating rail vertical anchor aligned with inset right sheets. */
export const SHEET_FLOATING_RAIL_TOP_INSET_CLASS = 'sm:top-[calc(2.5vh+0.625rem)]';

/** Center-rise sheet width presets (compact entity forms, credentials). */
export const CENTER_SHEET_WIDTH_MEDIUM_CLASS =
  'flex w-[min(48rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0';

export const CENTER_SHEET_WIDTH_COMPACT_CLASS =
  'flex w-[min(42rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0';

export const CENTER_SHEET_WIDTH_AUXILIARY_CLASS =
  'flex w-[min(36rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0';

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

/** Inner control height inside {@link DETAIL_SHEET_FIELD_SHELL_CLASS} (all field types). */
export const DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS =
  'h-8 min-h-8 max-h-8 flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0';

/** Select trigger inside a field shell — strips default Select chrome, keeps h-8. */
export const DETAIL_SHEET_SELECT_TRIGGER_IN_SHELL_CLASS = [
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  'font-normal',
  'border-0 shadow-none hover:border-0 hover:bg-transparent',
  'dark:border-0 dark:bg-transparent dark:hover:bg-transparent',
  'focus-visible:ring-0 focus-visible:ring-offset-0',
  'data-[size=sm]:h-8 data-[size=sm]:min-h-8 data-[size=sm]:px-0 data-[size=sm]:py-0',
].join(' ');

/** Controlled {@link InlineField} / date-in-shell wrapper. */
export const DETAIL_SHEET_FIELD_SHELL_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'flex w-full min-h-8 items-center gap-1 rounded-xl px-3 py-1',
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

/** Avatar + label open the linked entity sheet; shared hover tint (see relation picker chip). */
export const RELATION_PICKER_SHEET_TARGET_GROUP_CLASS =
  'group/open flex min-w-0 shrink items-center gap-2';

export const RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS =
  'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-1';

/** Person initials in relation chips — ring on group hover, no extra fill. */
export const RELATION_PICKER_PERSON_AVATAR_CLASS = [
  DETAIL_SHEET_PERSON_AVATAR_CLASS,
  'transition-[color,box-shadow]',
  'group-hover/open:text-sky-700 group-hover/open:ring-1 group-hover/open:ring-sky-500/45',
  'group-focus-within/open:text-sky-700 group-focus-within/open:ring-1 group-focus-within/open:ring-sky-500/45',
  'dark:group-hover/open:text-sky-300 dark:group-focus-within/open:text-sky-300',
].join(' ');

export const RELATION_PICKER_SHEET_TARGET_LABEL_CLASS = [
  'text-foreground block truncate font-medium transition-colors',
  'group-hover/open:text-sky-600 group-focus-within/open:text-sky-600',
  'dark:group-hover/open:text-sky-400 dark:group-focus-within/open:text-sky-400',
].join(' ');

export const RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS = [
  'text-muted-foreground block truncate text-[11px] transition-colors',
  'group-hover/open:text-sky-600/75 group-focus-within/open:text-sky-600/75',
  'dark:group-hover/open:text-sky-400/80 dark:group-focus-within/open:text-sky-400/80',
].join(' ');

/** Plain entity icon in chips (project, company, …) — no muted tile behind icon. */
export const RELATION_PICKER_ENTITY_ICON_INLINE_CLASS = [
  'text-muted-foreground size-4 shrink-0 transition-colors',
  'group-hover/open:text-sky-600 group-focus-within/open:text-sky-600',
  'dark:group-hover/open:text-sky-400 dark:group-focus-within/open:text-sky-400',
].join(' ');

/** Flex gap + chevron opens the search dropdown. */
export const RELATION_PICKER_REPLACE_ZONE_CLASS = [
  'text-muted-foreground/80 hover:text-foreground flex min-w-8 flex-1 items-center justify-end gap-0.5 rounded-md py-0.5 pr-0.5 pl-1 transition-colors',
  'hover:bg-muted/25 focus-visible:bg-muted/25',
  DETAIL_SHEET_FIELD_ACTIONS_ON_HOVER_CLASS,
].join(' ');

/** Full-width selected-value shell for {@link RelationPickerField} (all entity kinds). */
export const RELATION_PICKER_CHIP_SHELL_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  'border-border/40 flex w-full min-h-8 min-w-0 items-center gap-1 rounded-xl border border-transparent py-1 pr-1 pl-2.5 text-sm',
  'focus-within:border-border/50 transition-[border-color]',
].join(' ');

/** Vertical stack for multi-select relation chips (symmetric full-width rows). */
export const RELATION_PICKER_CHIP_STACK_CLASS = 'flex w-full flex-col gap-2';

/** Empty / add trigger aligned with relation chip width. */
export const RELATION_PICKER_EMPTY_TRIGGER_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'text-muted-foreground hover:text-foreground flex min-h-8 w-full items-center gap-2 rounded-xl px-3 py-1 text-left text-sm',
].join(' ');

/** Use on Save / Cancel in detail sheets and sticky form footers. */
export const DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE = 'form' as const;

/** Tab strip wrapper (Deal / entity detail sheets). */
export const DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS =
  'border-border shrink-0 border-b px-5 dark:border-stone-800';

export const DETAIL_SHEET_TAB_BAR_SCROLL_CLASS = 'flex gap-1 overflow-x-auto';

/** Shared tab button — pairs with active/inactive classes below. */
export const DETAIL_SHEET_TAB_BUTTON_BASE_CLASS =
  'relative flex shrink-0 items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors';

/** Active tab: brand tint (`--sidebar-accent` / `--primary`). */
export const DETAIL_SHEET_TAB_ACTIVE_CLASS = 'bg-sidebar-accent text-sidebar-accent-foreground';

export const DETAIL_SHEET_TAB_INACTIVE_CLASS =
  'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300';

/** Bottom indicator — matches floating rail `bg-primary`. */
export const DETAIL_SHEET_TAB_INDICATOR_CLASS =
  'absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-primary';
