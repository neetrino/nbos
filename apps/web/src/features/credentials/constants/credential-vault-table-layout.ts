import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
} from '@/components/shared/entity-list-table';

/** Centered columns (Login → URL): header and cell share the same axis. */
export const VAULT_LIST_CENTER_HEAD_CLASS = `${ENTITY_LIST_HEAD_CLASS} text-center`;

export const VAULT_LIST_CENTER_CELL_CLASS = `${ENTITY_LIST_CELL_CLASS} text-center align-middle`;

export const VAULT_LIST_CENTER_STACK_CLASS = 'flex flex-col items-center justify-center gap-1';

export const VAULT_LIST_CENTER_INLINE_CLASS = 'inline-flex max-w-full items-center justify-center';
