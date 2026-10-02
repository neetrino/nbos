'use client';

import { useId } from 'react';
import { usePermission } from '@/lib/permissions';
import { notifyPermissionDenied } from '@/lib/permissions/permission-denied';
import { useEntityRelations } from './entity-relations-context';
import type { RelationCreateContext, RelationEntityKind } from './relation-picker.types';
import { buildRelationCreateIntent } from './parse-relation-create-intent';

const CREATE_DISABLED_KINDS = new Set<RelationEntityKind>(['employee', 'order', 'deal']);

const RELATION_CREATE_PERMISSION: Partial<
  Record<RelationEntityKind, { module: string; action: string }>
> = {
  contact: { module: 'CLIENTS', action: 'ADD' },
  company: { module: 'CLIENTS', action: 'ADD' },
  partner: { module: 'PARTNERS', action: 'ADD' },
  project: { module: 'PROJECTS', action: 'ADD' },
  product: { module: 'PROJECTS', action: 'ADD' },
  credential: { module: 'CREDENTIALS', action: 'ADD' },
};

function canCreateEntity(kind: RelationEntityKind, context?: RelationCreateContext): boolean {
  if (CREATE_DISABLED_KINDS.has(kind)) return false;
  void context;
  return true;
}

/** Wires {@link RelationPickerField} create / open actions to {@link EntityRelationHost}. */
export function useRelationPickerActions(
  entityKind: RelationEntityKind,
  createIntent?: string,
  createContext?: RelationCreateContext,
) {
  const generatedIntent = useId();
  const fieldIntent = createIntent ?? generatedIntent;
  const { can } = usePermission();
  const relations = useEntityRelations();
  const canCreate = canCreateEntity(entityKind, createContext);
  const resolvedIntent = buildRelationCreateIntent(fieldIntent, createContext?.projectId);

  return {
    createIntent: fieldIntent,
    onCreate: canCreate
      ? (searchQuery: string) => {
          const requirement = RELATION_CREATE_PERMISSION[entityKind];
          if (requirement && !can(requirement.action, requirement.module)) {
            notifyPermissionDenied();
            return;
          }
          relations.openCreate(entityKind, searchQuery, resolvedIntent, createContext);
        }
      : undefined,
    onOpenSelected: (id: string) => relations.openEntity(entityKind, id),
  };
}
