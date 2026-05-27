import { DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS } from '../detail-sheet-classes';

export const ENTITY_NOTES_LABEL_CLASS =
  'text-muted-foreground/75 mb-1 block text-[10px] font-semibold tracking-[0.14em] uppercase';

/** Shell corner radius — softer than `rounded-xl` (Bitrix-style description bar). */
const ENTITY_NOTES_SHELL_RADIUS_CLASS = 'rounded-lg';

const ENTITY_NOTES_SHELL_LAYOUT_CLASS = [
  'flex w-full flex-col transition-[border-color,box-shadow]',
  ENTITY_NOTES_SHELL_RADIUS_CLASS,
].join(' ');

/** Passive: one white surface on sheet canvas (Bitrix-style — no nested border fill). */
export const ENTITY_NOTES_SHELL_PASSIVE_SURFACE_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  ENTITY_NOTES_SHELL_LAYOUT_CLASS,
  'cursor-text border-0 bg-white shadow-sm ring-1 ring-black/[0.05] dark:bg-card dark:ring-white/[0.07]',
].join(' ');

/** Active edit: same surface + focus ring (toolbar above editor). */
export const ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  ENTITY_NOTES_SHELL_LAYOUT_CLASS,
  'border-0 bg-white shadow-sm ring-1 ring-black/[0.05] dark:bg-card dark:ring-white/[0.07]',
  'focus-within:ring-2 focus-within:ring-blue-400/25',
].join(' ');

/** @deprecated Use passive/editing surface classes — kept for imports during migration. */
export const ENTITY_NOTES_SHELL_BASE_CLASS = ENTITY_NOTES_SHELL_PASSIVE_SURFACE_CLASS;

export const ENTITY_NOTES_SHELL_DISABLED_CLASS = 'pointer-events-none opacity-60';

export const ENTITY_NOTES_EDITOR_ROOT_CLASS = 'nbos-entity-notes-editor';

export const ENTITY_NOTES_EMPTY_HINT_CLASS =
  'text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1 text-xs';

export const ENTITY_NOTES_TOOLBAR_CLASS =
  'border-border/80 bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1';

export const ENTITY_NOTES_TOOLBAR_GROUP_CLASS = 'flex items-center gap-0.5';

export const ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS = 'bg-border/80 mx-1 h-5 w-px shrink-0';

export const ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS =
  'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100';
