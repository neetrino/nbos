'use client';

import { useEntityRelations } from './entity-relations-context';
import type { RelationCreateContext, RelationEntityKind } from './relation-picker.types';
import { buildRelationCreateIntent } from './parse-relation-create-intent';

const CREATE_DISABLED_KINDS = new Set<RelationEntityKind>(['employee']);

function canCreateEntity(kind: RelationEntityKind, context?: RelationCreateContext): boolean {
  if (CREATE_DISABLED_KINDS.has(kind)) return false;
  if (kind === 'product') return Boolean(context?.projectId);
  return true;
}

/** Wires {@link RelationPickerField} create / open actions to {@link EntityRelationHost}. */
export function useRelationPickerActions(
  entityKind: RelationEntityKind,
  createIntent?: string,
  createContext?: RelationCreateContext,
) {
  const relations = useEntityRelations();
  const canCreate = canCreateEntity(entityKind, createContext);
  const resolvedIntent = buildRelationCreateIntent(createIntent ?? '', createContext?.projectId);

  return {
    onCreate: canCreate
      ? (searchQuery: string) =>
          relations.openCreate(entityKind, searchQuery, resolvedIntent, createContext)
      : undefined,
    onOpenSelected: (id: string) => relations.openEntity(entityKind, id),
  };
}
