'use client';

import { useEntityRelations } from './entity-relations-context';
import type { RelationEntityKind } from './relation-picker.types';

/** Wires {@link RelationPickerField} create / open actions to {@link EntityRelationHost}. */
export function useRelationPickerActions(entityKind: RelationEntityKind, createIntent?: string) {
  const relations = useEntityRelations();
  return {
    onCreate: (searchQuery: string) => relations.openCreate(entityKind, searchQuery, createIntent),
    onOpenSelected: (id: string) => relations.openEntity(entityKind, id),
  };
}
