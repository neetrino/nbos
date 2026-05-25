'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { EntityItemOpenTarget, EntityItemSummary } from './entity-item.types';

export type EntityItemHostApi = {
  openEntityItem: (target: EntityItemOpenTarget) => void;
};

const EntityItemHostContext = createContext<EntityItemHostApi | null>(null);

export function EntityItemHostProvider({
  value,
  children,
}: {
  value: EntityItemHostApi;
  children: ReactNode;
}) {
  return <EntityItemHostContext.Provider value={value}>{children}</EntityItemHostContext.Provider>;
}

/** Opens a stacked child sheet for a related entity preview item. */
export function useEntityItemHost(): EntityItemHostApi {
  const ctx = useContext(EntityItemHostContext);
  if (!ctx) {
    throw new Error('useEntityItemHost must be used within EntityItemHost');
  }
  return ctx;
}

/** Convenience wrapper for {@link EntityItemList} `onOpen`. */
export function useOpenEntityItemFromSummary(): (item: EntityItemSummary) => void {
  const { openEntityItem } = useEntityItemHost();
  return useCallback(
    (item: EntityItemSummary) => openEntityItem({ id: item.id, kind: item.kind }),
    [openEntityItem],
  );
}
