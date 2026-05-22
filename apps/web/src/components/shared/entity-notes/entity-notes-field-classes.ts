import { DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS } from '../detail-sheet-classes';

export const ENTITY_NOTES_LABEL_CLASS =
  'text-muted-foreground mb-1.5 block text-xs font-medium tracking-wide';

export const ENTITY_NOTES_SHELL_BASE_CLASS = [
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  'bg-background flex w-full flex-col overflow-hidden rounded-xl border shadow-sm shadow-black/[0.04]',
  'border-border/70 transition-[border-color,box-shadow]',
  'focus-within:border-blue-400/90 focus-within:ring-2 focus-within:ring-blue-400/25',
].join(' ');

export const ENTITY_NOTES_SHELL_DISABLED_CLASS = 'pointer-events-none opacity-60';

export const ENTITY_NOTES_EDITOR_ROOT_CLASS = 'nbos-entity-notes-editor';

export const ENTITY_NOTES_SHELL_PASSIVE_CLASS = 'cursor-text';

export const ENTITY_NOTES_TOOLBAR_CLASS =
  'border-border/80 bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1';

export const ENTITY_NOTES_TOOLBAR_GROUP_CLASS = 'flex items-center gap-0.5';

export const ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS = 'bg-border/80 mx-1 h-5 w-px shrink-0';

export const ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS =
  'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100';
