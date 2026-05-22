'use client';

import { useEntityRelations } from './entity-relations-context';
import type { RelationEntityKind } from './relation-picker.types';

const CREATE_DISABLED_KINDS = new Set<RelationEntityKind>(['employee', 'product']);

/** Wires {@link RelationPickerField} create / open actions to {@link EntityRelationHost}. */
export function useRelationPickerActions(entityKind: RelationEntityKind, createIntent?: string) {
  const relations = useEntityRelations();
  const canCreate = !CREATE_DISABLED_KINDS.has(entityKind);
  return {
    onCreate: canCreate
      ? (searchQuery: string) => relations.openCreate(entityKind, searchQuery, createIntent)
      : undefined,
    onOpenSelected: (id: string) => relations.openEntity(entityKind, id),
  };
}
