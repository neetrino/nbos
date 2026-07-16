'use client';

import { createContext, useContext } from 'react';
import type {
  RelationCreateContext,
  RelationCreatePrefill,
  RelationEntityKind,
} from './relation-picker.types';

/** Optional actions when opening an entity sheet from a host surface. */
export type OpenEntityOptions = {
  /** Project About: show Remove opposite the name (team / contacts / company). */
  onRemoveParticipant?: () => void | Promise<void>;
};

export type EntityRelationsApi = {
  openEntity: (kind: RelationEntityKind, id: string, options?: OpenEntityOptions) => void;
  openCreate: (
    kind: RelationEntityKind,
    searchQuery?: string,
    intent?: string,
    context?: RelationCreateContext,
  ) => void;
  buildCreatePrefill: (kind: RelationEntityKind, searchQuery: string) => RelationCreatePrefill;
};

const EntityRelationsContext = createContext<EntityRelationsApi | null>(null);

export function EntityRelationsProvider({
  value,
  children,
}: {
  value: EntityRelationsApi;
  children: React.ReactNode;
}) {
  return (
    <EntityRelationsContext.Provider value={value}>{children}</EntityRelationsContext.Provider>
  );
}

/** Returns relation overlay actions; falls back to no-ops when host is not mounted. */
export function useEntityRelations(): EntityRelationsApi {
  const ctx = useContext(EntityRelationsContext);
  if (ctx) return ctx;
  return {
    openEntity: () => undefined,
    openCreate: () => undefined,
    buildCreatePrefill: () => ({}),
  };
}
