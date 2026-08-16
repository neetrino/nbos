import {
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
} from '../detail-sheet-classes';

const ENTITY_NOTES_SHELL_LAYOUT_CLASS = ['flex w-full flex-col rounded-xl', 'cursor-text'].join(
  ' ',
);

/** Passive: outlined quiet field shell (persistent thin border; min-height from ProseMirror). */
export const ENTITY_NOTES_SHELL_PASSIVE_SURFACE_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  ENTITY_NOTES_SHELL_LAYOUT_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
].join(' ');

/** Active edit: same outlined shell (toolbar above editor). */
export const ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  ENTITY_NOTES_SHELL_LAYOUT_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
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
